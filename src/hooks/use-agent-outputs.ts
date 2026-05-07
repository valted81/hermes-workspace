// use-agent-outputs.ts
//
// Operations Outputs feed backed by Hermes cron runs and session history.

import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { CronJob, CronRunStatus } from '@/components/cron-manager/cron-types'
import type { GatewayMessagePart, GatewaySession } from '@/lib/gateway-api'
import { fetchCronJobs } from '@/lib/cron-api'
import { fetchSessions } from '@/lib/gateway-api'

export type AgentOutputStatus = 'ok' | 'error' | 'running' | 'unknown'
export type AgentOutputFailureKind =
  | 'delivery'
  | 'config'
  | 'approval'
  | 'runtime'
  | undefined

export type AgentOutput = {
  id: string
  agentId: string
  agentName: string
  agentEmoji?: string
  jobId?: string
  jobName?: string
  timestamp: number
  durationMs?: number
  status: AgentOutputStatus
  statusLabel?: string
  failureKind?: AgentOutputFailureKind
  summary: string
  fullOutput: string
  model?: string
  sessionKey?: string
  chatSessionKey?: string
  error?: string
}

export type AgentOutputFilter = 'all' | 'ok' | 'error' | 'running'

export type AgentOutputFilterOption = {
  id: AgentOutputFilter
  label: string
  emoji?: string
}

const DEFAULT_FILTERS: Array<AgentOutputFilterOption> = [
  { id: 'all', label: 'All', emoji: '📋' },
  { id: 'ok', label: 'Success', emoji: '✅' },
  { id: 'error', label: 'Errors', emoji: '❌' },
  { id: 'running', label: 'Running', emoji: '⏳' },
]

const AGENT_META: Partial<Record<string, { name: string; emoji: string }>> = {
  default: { name: 'Workspace / Default', emoji: '🏠' },
  hermesmain: { name: 'Hermes Main Agent', emoji: '🧭' },
  tradinganalyst: { name: 'Trading Analyst', emoji: '📈' },
  macronewsscout: { name: 'Macro News Scout', emoji: '🛰️' },
  riskmanager: { name: 'Risk Manager', emoji: '🛡️' },
  strategyreviewer: { name: 'Strategy Reviewer', emoji: '🧠' },
  operationswatcher: { name: 'Operations Watcher', emoji: '🛠️' },
  cron: { name: 'Hermes Cron', emoji: '⏱️' },
}

function safeDisplayValue(value: unknown): string {
  if (typeof value === 'string') return value
  if (value == null) return ''
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

function readTimestamp(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value > 1_000_000_000_000 ? value : value * 1000
  }
  if (typeof value === 'string' && value.trim()) {
    const parsed = Date.parse(value)
    return Number.isNaN(parsed) ? null : parsed
  }
  return null
}

function truncate(text: string, maxLength = 180): string {
  const normalized = text.replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxLength) return normalized
  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`
}

function normalizeAgentId(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
}

function titleCaseSlug(value: string): string {
  return value
    .replace(/^ops:/, '')
    .replace(/[:_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function agentLabel(agentId: string) {
  return AGENT_META[agentId] || {
    name: titleCaseSlug(agentId) || agentId,
    emoji: '🤖',
  }
}

function inferAgentIdFromText(value: string): string {
  const normalized = normalizeAgentId(value)
  if (
    normalized.includes('trading') ||
    normalized.includes('crypto') ||
    normalized.includes('btc') ||
    normalized.includes('eth') ||
    normalized.includes('sol') ||
    normalized.includes('tradingagentcouncil')
  ) return 'tradinganalyst'
  for (const id of Object.keys(AGENT_META)) {
    if (id !== 'cron' && normalized.includes(id)) return id
  }
  if (normalized.includes('risk')) return 'riskmanager'
  if (normalized.includes('macro') || normalized.includes('news')) return 'macronewsscout'
  if (normalized.includes('strategy') || normalized.includes('review')) return 'strategyreviewer'
  if (normalized.includes('ops') || normalized.includes('log')) return 'operationswatcher'
  return 'hermesmain'
}

function inferAgentIdFromCron(job: CronJob): string {
  const match = job.name.match(/^ops:([^:]+):/)
  if (match?.[1]) return normalizeAgentId(match[1])
  return inferAgentIdFromText(`${job.name} ${job.description || ''}`)
}

function cronStatus(status?: CronRunStatus): AgentOutputStatus {
  if (status === 'success') return 'ok'
  if (status === 'error') return 'error'
  if (status === 'running' || status === 'queued') return 'running'
  return 'unknown'
}

function messagePartsToText(parts: Array<GatewayMessagePart>): string {
  return parts
    .map((part) => {
      if (typeof part.text === 'string') return part.text
      if (part.type === 'tool_use') {
        const name = typeof part.name === 'string' ? part.name : 'unknown'
        return `[tool:${name}]`
      }
      if (part.type === 'tool_result') return safeDisplayValue(part.content)
      return safeDisplayValue(part)
    })
    .filter(Boolean)
    .join('\n')
}

function sessionText(session: GatewaySession): string {
  const last = session.lastMessage
  if (last?.text?.trim()) return last.text.trim()
  if (Array.isArray(last?.content)) return messagePartsToText(last.content).trim()
  return [session.derivedTitle, session.title, session.task, session.initialMessage]
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .find(Boolean) || ''
}

function cronOutput(job: CronJob): AgentOutput | null {
  const run = job.lastRun
  const timestamp = readTimestamp(run?.startedAt) || readTimestamp(job.nextRunAt)
  if (!timestamp || !run) return null

  const agentId = inferAgentIdFromCron(job)
  const meta = agentLabel(agentId)
  const output = safeDisplayValue(run.output)
  const summary =
    run.deliverySummary?.trim() ||
    run.error?.trim() ||
    truncate(output, 180) ||
    job.description?.trim() ||
    titleCaseSlug(job.name)

  return {
    id: `cron-${job.id}-${run.id || timestamp}`,
    agentId,
    agentName: meta.name,
    agentEmoji: meta.emoji,
    jobId: job.id,
    jobName: titleCaseSlug(job.name),
    timestamp,
    durationMs: run.durationMs,
    status: cronStatus(run.status),
    statusLabel: run.status,
    failureKind: run.status === 'error' ? 'runtime' : undefined,
    summary: truncate(summary, 220),
    fullOutput: output || summary,
    chatSessionKey: run.chatSessionKey,
    error: run.error,
  }
}

function sessionOutput(session: GatewaySession): AgentOutput | null {
  const timestamp = readTimestamp(session.updatedAt) || readTimestamp(session.createdAt)
  const text = sessionText(session)
  if (!timestamp || !text) return null

  const key = typeof session.key === 'string' ? session.key : ''
  const label = typeof session.label === 'string' ? session.label : ''
  const agentId = inferAgentIdFromText(`${key} ${label} ${session.title || ''} ${text}`)
  const meta = agentLabel(agentId)
  const statusText = typeof session.status === 'string' ? session.status.toLowerCase() : ''
  const status: AgentOutputStatus = statusText.includes('error') || statusText.includes('fail')
    ? 'error'
    : statusText.includes('running') || statusText.includes('active')
      ? 'running'
      : 'ok'

  return {
    id: `session-${key || timestamp}`,
    agentId,
    agentName: meta.name,
    agentEmoji: meta.emoji,
    jobName: session.derivedTitle || session.title || 'Session output',
    timestamp,
    status,
    statusLabel: session.status,
    failureKind: status === 'error' ? 'runtime' : undefined,
    summary: truncate(text, 220),
    fullOutput: text,
    model: session.model,
    sessionKey: key,
  }
}

export function useAgentOutputs(filter: AgentOutputFilter) {
  const queryClient = useQueryClient()

  const cronQuery = useQuery<Array<CronJob>>({
    queryKey: ['operations', 'outputs', 'cron'],
    queryFn: fetchCronJobs,
    refetchInterval: 30_000,
  })

  const sessionsQuery = useQuery<Array<GatewaySession>>({
    queryKey: ['operations', 'outputs', 'sessions'],
    queryFn: async () => {
      const response = await fetchSessions()
      return Array.isArray(response.sessions) ? response.sessions : []
    },
    refetchInterval: 30_000,
  })

  const outputs = useMemo(() => {
    const combined = [
      ...(cronQuery.data || []).map(cronOutput),
      ...(sessionsQuery.data || []).map(sessionOutput),
    ]
      .filter((item): item is AgentOutput => Boolean(item))
      .sort((left, right) => right.timestamp - left.timestamp)
      .slice(0, 60)

    if (filter === 'all') return combined
    return combined.filter((item) => item.status === filter)
  }, [cronQuery.data, sessionsQuery.data, filter])

  const refresh = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['operations', 'outputs', 'cron'] }),
      queryClient.invalidateQueries({ queryKey: ['operations', 'outputs', 'sessions'] }),
    ])
  }

  return {
    outputs,
    availableFilters: DEFAULT_FILTERS,
    loading: cronQuery.isPending || sessionsQuery.isPending,
    error:
      (cronQuery.error instanceof Error && cronQuery.error.message) ||
      (sessionsQuery.error instanceof Error && sessionsQuery.error.message) ||
      null,
    refresh,
  }
}
