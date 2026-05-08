import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import * as YAML from 'yaml'
import { isAuthenticated } from '../../server/auth-middleware'
import { getProfilesDir } from '../../server/claude-paths'
import { readWorkerMessages } from '../../server/swarm-chat-reader'

const VT_REPO_DIR = '/root/Code/vt-capital'
const VT_QUEUES_DIR = path.join(VT_REPO_DIR, 'queues')
const VT_ORDER_PROPOSED_PATH = path.join(VT_QUEUES_DIR, 'order.proposed.jsonl')
const VT_ORDER_EXECUTED_PATH = path.join(VT_QUEUES_DIR, 'order.executed.jsonl')
const VT_DEMO_STATE_PATH = path.join(
  VT_REPO_DIR,
  'data/demo_guardian_loop/state.json',
)
const VT_SHADOW_AUDIT_PATH = path.join(
  VT_REPO_DIR,
  'data/shadow/agents-vt-capital-shadow.jsonl',
)
const VT_AUTORESEARCH_CONFIG_PATH = path.join(
  VT_REPO_DIR,
  'config/autoresearch.yaml',
)
const VT_BACKTEST_DATA_DIR = path.join(VT_REPO_DIR, 'data/desks/desk-a-swing')
const VT_STRATEGY_REGISTRY_PATH = path.join(
  VT_REPO_DIR,
  'data/strategies/registry.json',
)
const VT_BACKTEST_RESULTS_PATH = path.join(
  VT_REPO_DIR,
  'data/strategies/autoresearch-backtest-results.json',
)
const VT_STRATEGY_TEST_LOG_PATH = path.join(
  VT_REPO_DIR,
  'data/strategies/strategy-test-log.jsonl',
)
const VT_FORWARD_TEST_QUEUE_PATH = path.join(
  VT_REPO_DIR,
  'data/strategies/forward-test-queue.json',
)
const VT_FORWARD_TEST_QUEUE_LOG_PATH = path.join(
  VT_REPO_DIR,
  'data/strategies/forward-test-queue.jsonl',
)
const VT_FORWARD_PERFORMANCE_PATH = path.join(
  VT_REPO_DIR,
  'data/strategies/forward-performance.json',
)
const VT_FORWARD_PERFORMANCE_LOG_PATH = path.join(
  VT_REPO_DIR,
  'data/strategies/forward-performance.jsonl',
)
const VT_MANUAL_REVIEW_PATH = path.join(
  VT_REPO_DIR,
  'data/strategies/manual-paper-review.json',
)
const VT_MANUAL_REVIEW_LOG_PATH = path.join(
  VT_REPO_DIR,
  'data/strategies/manual-paper-review.jsonl',
)
const TRADING_NOTES_DIR = '/root/hermes-vault/03-Trading-Notes'
const SESSION_NOTES_DIR = '/root/hermes-vault/01-Sessioni'
const HOURLY_BIAS_PATH = path.join(
  TRADING_NOTES_DIR,
  'crypto-hourly-bias.jsonl',
)
const PRECHECK_PATH = path.join(
  TRADING_NOTES_DIR,
  'crypto-council-precheck.jsonl',
)
const VT_WORKERS = [
  'hermesmain',
  'tradinganalyst',
  'macronewsscout',
  'riskmanager',
  'strategyreviewer',
  'operationswatcher',
]

const COUNCIL_AGENT_CATALOG: Record<
  string,
  {
    name: string
    emoji: string
    councilRole: string
    shortRole: string
    skills: Array<string>
    chatPrompt: string
  }
> = {
  hermesmain: {
    name: 'Hermes Main',
    emoji: '◈',
    councilRole: 'Coordinatore Concilium',
    shortRole: 'aggregazione, sintesi e prossima azione',
    skills: [
      'orchestrazione',
      'sintesi decisionale',
      'vault notes',
      'follow-up',
    ],
    chatPrompt:
      'Sintetizza il Concilium VT Capital e proponi la prossima osservazione sicura.',
  },
  tradinganalyst: {
    name: 'Trading Analyst',
    emoji: '📈',
    councilRole: 'Analista tecnico',
    shortRole: 'trend, livelli, trigger, invalidazione',
    skills: ['RSI/EMA/MACD', 'ATR e stop', 'volume relativo', 'setup quality'],
    chatPrompt:
      'Analizza tecnicamente gli asset in watchlist e segnala trigger/invalidation.',
  },
  macronewsscout: {
    name: 'Macro News Scout',
    emoji: '🛰️',
    councilRole: 'News/Macro scout',
    shortRole: 'contesto esterno, risk-on/risk-off, headline',
    skills: ['news crypto', 'macro calendar', 'risk regime', 'event risk'],
    chatPrompt:
      'Controlla contesto macro/news che può invalidare i segnali VT Capital.',
  },
  riskmanager: {
    name: 'Risk Manager',
    emoji: '🛡️',
    councilRole: 'Bear/Risk gate',
    shortRole: 'drawdown, sizing, blocchi prudenziali',
    skills: ['risk gates', 'drawdown', 'duplicate order', 'reason code'],
    chatPrompt:
      'Valuta il rischio di portafoglio, drawdown e motivi per bloccare un setup.',
  },
  strategyreviewer: {
    name: 'Strategy Reviewer',
    emoji: '🧭',
    councilRole: 'Revisore strategia',
    shortRole: 'qualità strategia, bias opposti, coerenza',
    skills: ['bull/bear case', 'strategy fit', 'paper tracking', 'post-mortem'],
    chatPrompt:
      'Rivedi le ultime decisioni Concilium e trova incoerenze o miglioramenti.',
  },
  operationswatcher: {
    name: 'Operations Watcher',
    emoji: '🧰',
    councilRole: 'Watcher operativo',
    shortRole: 'cron, file, audit, runtime shadow',
    skills: [
      'cron status',
      'JSONL audit',
      'pipeline health',
      'dashboard checks',
    ],
    chatPrompt:
      'Controlla salute runtime VT Capital, cron, shadow audit e file dati.',
  },
}

type JsonRecord = Record<string, unknown>

function safeStat(filePath: string): fs.Stats | null {
  try {
    return fs.statSync(filePath)
  } catch {
    return null
  }
}

function readLastLines(filePath: string, limit = 8): Array<JsonRecord> {
  if (!fs.existsSync(filePath)) return []
  try {
    return fs
      .readFileSync(filePath, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(-limit)
      .map((line) => {
        try {
          return JSON.parse(line) as JsonRecord
        } catch {
          return { raw: line }
        }
      })
  } catch {
    return []
  }
}

function countJsonlRecords(filePath: string): number {
  if (!fs.existsSync(filePath)) return 0
  try {
    return fs
      .readFileSync(filePath, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean).length
  } catch {
    return 0
  }
}

function listRecentNotes(): Array<{
  title: string
  path: string
  mtimeMs: number
  size: number
}> {
  const notes: Array<{
    title: string
    path: string
    mtimeMs: number
    size: number
  }> = []
  for (const dir of [TRADING_NOTES_DIR, SESSION_NOTES_DIR]) {
    if (!fs.existsSync(dir)) continue
    for (const name of fs.readdirSync(dir)) {
      const lower = name.toLowerCase()
      if (!lower.endsWith('.md')) continue
      if (!lower.includes('vt-capital') && !lower.includes('crypto')) continue
      const filePath = path.join(dir, name)
      const stat = safeStat(filePath)
      if (stat?.isFile())
        notes.push({
          title: name.replace(/\.md$/, ''),
          path: filePath,
          mtimeMs: stat.mtimeMs,
          size: stat.size,
        })
    }
  }
  return notes.sort((a, b) => b.mtimeMs - a.mtimeMs).slice(0, 8)
}

function readWorkerRuntime(workerId: string): JsonRecord {
  const profilePath = path.join(getProfilesDir(), workerId)
  const runtimePath = path.join(profilePath, 'runtime.json')
  const memoryPath = path.join(profilePath, 'memory', 'MEMORY.md')
  const identityPath = path.join(profilePath, 'memory', 'IDENTITY.md')
  const soulPath = path.join(profilePath, 'SOUL.md')
  const catalog = COUNCIL_AGENT_CATALOG[workerId] ?? {
    name: workerId,
    emoji: '🤖',
    councilRole: workerId,
    shortRole: workerId,
    skills: [],
    chatPrompt: `Parla come ${workerId} del Concilium VT Capital.`,
  }
  let runtime: JsonRecord = {}
  try {
    runtime = fs.existsSync(runtimePath)
      ? (JSON.parse(fs.readFileSync(runtimePath, 'utf8')) as JsonRecord)
      : {}
  } catch {
    runtime = {}
  }
  const chat = readWorkerMessages(profilePath, 6)
  const assistantMessages = chat.messages.filter(
    (message) => message.role === 'assistant' && message.content.trim(),
  )
  const latestAnalysis = assistantMessages.at(-1)?.content.slice(0, 900) ?? null
  return {
    workerId,
    profilePath,
    name: catalog.name,
    emoji: catalog.emoji,
    councilRole: catalog.councilRole,
    shortRole: catalog.shortRole,
    skills: catalog.skills,
    chatPrompt: catalog.chatPrompt,
    chatUrl: `/chat/${workerId}`,
    state: typeof runtime.state === 'string' ? runtime.state : 'unknown',
    role: typeof runtime.role === 'string' ? runtime.role : catalog.councilRole,
    currentTask:
      typeof runtime.currentTask === 'string' ? runtime.currentTask : null,
    lastSummary:
      typeof runtime.lastSummary === 'string'
        ? runtime.lastSummary
        : latestAnalysis,
    latestAnalysis,
    recentMessages: chat.messages.slice(-4),
    sessionId: chat.sessionId,
    sessionTitle: chat.sessionTitle,
    chatAvailable: chat.ok,
    memoryExists: fs.existsSync(memoryPath),
    identityExists: fs.existsSync(identityPath),
    runtimeExists: fs.existsSync(runtimePath),
    soulExists: fs.existsSync(soulPath),
  }
}

function summarizeLatestBias(records: Array<JsonRecord>): JsonRecord | null {
  if (records.length === 0) return null
  const latest = records[records.length - 1]
  const candidates = Array.isArray(latest.council_candidates)
    ? latest.council_candidates
    : Array.isArray(latest.assets)
      ? latest.assets
      : []
  return {
    generatedAt:
      latest.generated_at ?? latest.generatedAt ?? latest.timestamp ?? null,
    source: latest.source ?? 'crypto-hourly-bias',
    candidateCount: candidates.length,
    candidates,
    raw: latest,
  }
}

function readJsonFile(filePath: string): JsonRecord | null {
  try {
    if (!fs.existsSync(filePath)) return null
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as JsonRecord
  } catch {
    return null
  }
}

function payloadOf(record: JsonRecord | null): JsonRecord | null {
  if (!record) return null
  const payload = record.payload
  return payload && typeof payload === 'object'
    ? (payload as JsonRecord)
    : record
}

function sourceProposal(record: JsonRecord | null): JsonRecord | null {
  const payload = payloadOf(record)
  if (!payload) return null
  const source = payload.source_proposal
  return source && typeof source === 'object' ? (source as JsonRecord) : payload
}

function flattenExecutedOrder(record: JsonRecord | null): JsonRecord | null {
  const payload = payloadOf(record)
  if (!payload) return null
  const order =
    payload.order && typeof payload.order === 'object'
      ? (payload.order as JsonRecord)
      : {}
  const proposal = sourceProposal(record) ?? {}
  return {
    ...proposal,
    ...order,
    approval_id: order.approval_id ?? proposal.approval_id ?? null,
    book: order.book ?? proposal.book ?? null,
    strategy_id: order.strategy_id ?? proposal.strategy_id ?? null,
    intent: order.intent ?? proposal.intent ?? null,
    position_horizon:
      order.position_horizon ?? proposal.position_horizon ?? null,
  }
}

export function resolveGuardianOrderEvents(
  proposedRecords: Array<JsonRecord>,
  executedRecords: Array<JsonRecord>,
): {
  lastRiskCheck: JsonRecord | null
  lastOrderProposed: JsonRecord | null
  lastOrderExecuted: JsonRecord | null
} {
  const executedSourceProposal = sourceProposal(executedRecords.at(-1) ?? null)
  const lastOrderProposed =
    sourceProposal(proposedRecords.at(-1) ?? null) ?? executedSourceProposal
  const lastOrderExecuted = flattenExecutedOrder(executedRecords.at(-1) ?? null)
  const lastRiskCheck = lastOrderProposed ?? executedSourceProposal
  return { lastRiskCheck, lastOrderProposed, lastOrderExecuted }
}

function summariseDemoState(): JsonRecord {
  const state = readJsonFile(VT_DEMO_STATE_PATH)
  const orders = Array.isArray(state?.orders)
    ? (state.orders as Array<JsonRecord>)
    : []
  const lastOrder = orders.length > 0 ? orders[orders.length - 1] : null
  return {
    trackedOrders: orders.length,
    openOrders: orders.filter((order) => order.status === 'open').length,
    lastOrder,
  }
}

function recentGuardianBlocks(records: Array<JsonRecord>): Array<JsonRecord> {
  return records
    .map(payloadOf)
    .filter((payload): payload is JsonRecord => Boolean(payload))
    .filter((payload) =>
      Boolean(
        payload.reason_code ||
        payload.reason ||
        payload.error ||
        payload.rejected,
      ),
    )
    .slice(-5)
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return null
}

function round2(value: number): number {
  return Math.round(value * 100) / 100
}

function normalizeSymbol(value: unknown): string {
  return String(value ?? '')
    .replace('/', '')
    .toUpperCase()
}

function latestAssetPrices(
  marketBias: JsonRecord | null,
): Record<string, JsonRecord> {
  const candidates: Array<JsonRecord | null> = []
  candidates.push(marketBias)
  if (marketBias?.raw && typeof marketBias.raw === 'object')
    candidates.push(marketBias.raw as JsonRecord)
  if (marketBias?.latest && typeof marketBias.latest === 'object') {
    const latest = marketBias.latest as JsonRecord
    candidates.push(latest)
    if (latest.raw && typeof latest.raw === 'object')
      candidates.push(latest.raw as JsonRecord)
  }
  for (const candidate of candidates) {
    if (!candidate) continue
    const assets = candidate.assets
    if (assets && typeof assets === 'object')
      return assets as Record<string, JsonRecord>
  }
  return {}
}

export function summarizeCouncilHistory(
  records: Array<JsonRecord>,
): JsonRecord {
  const timeline = records
    .slice()
    .reverse()
    .map((record) => {
      const decision = String(record.decision ?? 'precheck')
      const confidenceFinal = asNumber(record.confidence_final)
      return {
        timestamp: record.generated_at ?? record.timestamp ?? null,
        asset: record.asset ?? record.symbol ?? '—',
        timeframe: record.timeframe ?? '—',
        bias: record.bias ?? record.candidate_bias ?? '—',
        decision,
        confidenceInitial: asNumber(record.confidence_initial),
        confidenceFinal,
        trigger: record.trigger ?? record.trigger_reference ?? null,
        invalidation: record.invalidation ?? null,
        mainRisk: record.main_risk ?? record.reason ?? null,
        agent:
          record.rule_source === 'python_precheck'
            ? 'precheck deterministico'
            : String(record.agent ?? record.role ?? 'concilium'),
        stance:
          decision === 'PAPER'
            ? 'costruttiva'
            : decision === 'DISCARD'
              ? 'contraria'
              : 'prudente',
        raw: record,
      }
    })
  const counts = timeline.reduce<Record<string, number>>((acc, item) => {
    const decision = String(item.decision)
    acc[decision] = (acc[decision] ?? 0) + 1
    return acc
  }, {})
  const latest = timeline.length > 0 ? timeline[0] : null
  return {
    total: records.length,
    latestDecision: latest ? latest.decision : null,
    latestAsset: latest ? latest.asset : null,
    latestRisk: latest ? latest.mainRisk : null,
    counts,
    timeline,
  }
}

export function buildPortfolioSnapshot(
  demoState: JsonRecord | null,
  marketBias: JsonRecord | null,
): JsonRecord {
  const orders = Array.isArray(demoState?.orders)
    ? (demoState.orders as Array<JsonRecord>)
    : []
  const prices = latestAssetPrices(marketBias)
  const activeOrders = orders.filter((order) => order.status === 'open')
  const grouped = new Map<string, Array<JsonRecord>>()
  for (const order of activeOrders) {
    const symbol = String(order.symbol ?? 'UNKNOWN')
    grouped.set(symbol, [...(grouped.get(symbol) ?? []), order])
  }
  const assets = Array.from(grouped.entries()).map(([symbol, group]) => {
    const quantity = group.reduce(
      (sum, order) => sum + (asNumber(order.amount ?? order.quantity) ?? 0),
      0,
    )
    const cost = group.reduce((sum, order) => {
      const amount = asNumber(order.amount ?? order.quantity) ?? 0
      const price = asNumber(order.price ?? order.entry_price) ?? 0
      return sum + amount * price
    }, 0)
    const avgEntry = quantity > 0 ? cost / quantity : 0
    const market = prices[normalizeSymbol(symbol)] ?? {}
    const lastPrice = asNumber(market.price) ?? avgEntry
    const markToMarketValue = quantity * lastPrice
    const unrealizedPnl = markToMarketValue - cost
    const unrealizedPnlPct = cost > 0 ? (unrealizedPnl / cost) * 100 : 0
    const stopLoss = asNumber(group.at(-1)?.stop_loss)
    const maxRiskToStop = stopLoss
      ? Math.max(0, (avgEntry - stopLoss) * quantity)
      : 0
    const first = group[0] ?? {}
    return {
      symbol,
      book: first.book ?? 'trading',
      strategyId: first.strategy_id ?? null,
      side: first.side ?? null,
      status: 'open',
      openQuantity: round2(quantity),
      avgEntry: round2(avgEntry),
      lastPrice: round2(lastPrice),
      openExposure: round2(cost),
      markToMarketValue: round2(markToMarketValue),
      unrealizedPnl: round2(unrealizedPnl),
      unrealizedPnlPct: round2(unrealizedPnlPct),
      maxRiskToStop: round2(maxRiskToStop),
      riskToStopPct: cost > 0 ? round2((maxRiskToStop / cost) * 100) : 0,
      signal: market.signal ?? null,
      confidence: market.confidence ?? null,
      orders: group.slice(-5),
    }
  })
  const openExposure = assets.reduce(
    (sum, asset) => sum + Number(asset.openExposure),
    0,
  )
  const markToMarketValue = assets.reduce(
    (sum, asset) => sum + Number(asset.markToMarketValue),
    0,
  )
  const unrealizedPnl = markToMarketValue - openExposure
  const maxRiskToStop = assets.reduce(
    (sum, asset) => sum + Number(asset.maxRiskToStop),
    0,
  )
  const assetsWithAllocation = assets.map((asset) => ({
    ...asset,
    allocationPct:
      markToMarketValue > 0
        ? round2((Number(asset.markToMarketValue) / markToMarketValue) * 100)
        : 0,
  }))
  return {
    activeTrades: activeOrders.filter((order) => order.book !== 'investment')
      .length,
    activeInvestments: activeOrders.filter(
      (order) => order.book === 'investment',
    ).length,
    openExposure: round2(openExposure),
    markToMarketValue: round2(markToMarketValue),
    unrealizedPnl: round2(unrealizedPnl),
    unrealizedPnlPct:
      openExposure > 0 ? round2((unrealizedPnl / openExposure) * 100) : 0,
    maxRiskToStop: round2(maxRiskToStop),
    riskToStopPct:
      openExposure > 0 ? round2((maxRiskToStop / openExposure) * 100) : 0,
    assetCount: assetsWithAllocation.length,
    assets: assetsWithAllocation,
    activeOrders: activeOrders.slice(-20).reverse(),
  }
}

export function readAutoresearchConfig(): JsonRecord {
  const stat = safeStat(VT_AUTORESEARCH_CONFIG_PATH)
  let raw: JsonRecord = {}
  try {
    raw = stat
      ? ((YAML.parse(
          fs.readFileSync(VT_AUTORESEARCH_CONFIG_PATH, 'utf8'),
        ) as JsonRecord | null) ?? {})
      : {}
  } catch {
    raw = {}
  }
  const useCases =
    raw.use_cases && typeof raw.use_cases === 'object'
      ? (raw.use_cases as Record<string, JsonRecord>)
      : {}
  const enabledUseCases = Object.entries(useCases)
    .filter(([, value]) => value.enabled === true)
    .map(([key]) => key)
  const agents = Array.isArray(raw.agents)
    ? (raw.agents as Array<JsonRecord>)
    : [
        {
          id: 'strategy-researcher',
          name: 'Strategy Researcher',
          status: 'planned',
          role: 'cerca concetti online e propone ipotesi testabili',
        },
        {
          id: 'strategy-coder',
          name: 'Strategy Coder',
          status: 'planned',
          role: 'traduce le idee in moduli Python isolati',
        },
        {
          id: 'backtest-analyst',
          name: 'Backtest Analyst',
          status: 'planned',
          role: 'misura win-rate, expectancy, drawdown e robustezza',
        },
        {
          id: 'forward-tester',
          name: 'Forward Tester',
          status: 'planned',
          role: 'segue paper/forward test prima del gate',
        },
      ]
  const inspirations = Array.isArray(raw.inspirations)
    ? (raw.inspirations as Array<JsonRecord>)
    : [
        { name: 'Karpathy-style autoresearch', type: 'method' },
        {
          name: 'Nunchi auto-researchtrading',
          type: 'repo',
          repo: 'https://github.com/Nunchi-trade/auto-researchtrading',
        },
      ]
  const workflow = Array.isArray(raw.workflow)
    ? raw.workflow.map(String)
    : [
        'research_concepts',
        'draft_strategy',
        'code_python_module',
        'backtest',
        'walk_forward',
        'risk_review',
        'concilium_review',
        'paper_observe_candidate',
      ]
  const researchTopics = Array.isArray(raw.research_topics)
    ? raw.research_topics.map(String)
    : [
        'trend following',
        'mean reversion',
        'breakout',
        'volatility squeeze',
        'funding rate',
        'DCA intelligente',
      ]
  return {
    fileExists: Boolean(stat),
    updatedAt: stat?.mtimeMs ?? null,
    enabled: raw.enabled === true,
    status: raw.enabled === true ? 'armed' : 'off',
    mode: typeof raw.mode === 'string' ? raw.mode : 'observe_only',
    executionEnabled: false,
    liveTradingEnabled: false,
    demoTradingEnabled: false,
    enabledUseCases,
    useCases,
    inspirations,
    workflow,
    researchTopics,
    agents,
    safeguards: Array.isArray(raw.safeguards)
      ? raw.safeguards
      : [
          'no_broker_calls',
          'no_live_trading',
          'paper_only_after_backtest_pass',
          'human_gate_for_demo_or_live',
        ],
  }
}

function readStrategyRegistry(): JsonRecord {
  const stat = safeStat(VT_STRATEGY_REGISTRY_PATH)
  const fallback = {
    fileExists: false,
    updatedAt: null,
    mode: 'observe_only',
    executionEnabled: false,
    liveTradingEnabled: false,
    pipeline: [
      'research',
      'create',
      'backtest',
      'concilium',
      'paper_observe',
      'gate',
    ],
    safeguards: [
      'no_broker_calls',
      'no_live_trading',
      'paper_only_after_backtest_pass',
      'human_gate_for_demo_or_live',
    ],
    strategies: [],
  }
  const raw = readJsonFile(VT_STRATEGY_REGISTRY_PATH)
  if (!raw) return fallback
  return {
    fileExists: Boolean(stat),
    updatedAt: stat?.mtimeMs ?? null,
    mode: typeof raw.mode === 'string' ? raw.mode : 'observe_only',
    executionEnabled: raw.execution_enabled === true,
    liveTradingEnabled: raw.live_trading_enabled === true,
    pipeline: Array.isArray(raw.pipeline) ? raw.pipeline : fallback.pipeline,
    safeguards: Array.isArray(raw.safeguards)
      ? raw.safeguards
      : fallback.safeguards,
    strategies: Array.isArray(raw.strategies) ? raw.strategies : [],
  }
}

export function readBacktestResults(): JsonRecord {
  const stat = safeStat(VT_BACKTEST_RESULTS_PATH)
  const raw = readJsonFile(VT_BACKTEST_RESULTS_PATH)
  return {
    fileExists: Boolean(stat),
    updatedAt: stat?.mtimeMs ?? null,
    generatedAt:
      typeof raw?.generated_at === 'string' ? raw.generated_at : null,
    mode: typeof raw?.mode === 'string' ? raw.mode : 'observe_only',
    executionEnabled: raw?.execution_enabled === true,
    dataDir: typeof raw?.data_dir === 'string' ? raw.data_dir : null,
    results: Array.isArray(raw?.results) ? raw.results : [],
  }
}

export function summarizeStrategyTestLogs(
  records: Array<JsonRecord>,
  eventCount: number,
  updatedAt: number | null,
): JsonRecord {
  const byStrategy: Record<string, number> = {}
  const byConcilium: Record<string, number> = {}
  let latestConcilium: JsonRecord | null = null
  let conciliumReviewed = 0

  for (const record of records) {
    const strategyId = String(record.strategy_id ?? 'unknown')
    byStrategy[strategyId] = (byStrategy[strategyId] ?? 0) + 1
    const review =
      record.concilium_review &&
      typeof record.concilium_review === 'object' &&
      !Array.isArray(record.concilium_review)
        ? (record.concilium_review as JsonRecord)
        : null
    if (review) {
      conciliumReviewed += 1
      const recommendation = String(
        review.recommendation ?? record.decision ?? 'UNKNOWN',
      )
      byConcilium[recommendation] = (byConcilium[recommendation] ?? 0) + 1
      latestConcilium = review
    }
  }
  return {
    fileExists: eventCount > 0,
    updatedAt,
    eventCount,
    byStrategy,
    byConcilium,
    latestConcilium,
    concilium: {
      reviewed: conciliumReviewed,
      recommendations: byConcilium,
      latest: latestConcilium,
    },
    recent: records.slice(-60).reverse(),
  }
}

export function readForwardTestQueue(): JsonRecord {
  const stat = safeStat(VT_FORWARD_TEST_QUEUE_PATH)
  const logStat = safeStat(VT_FORWARD_TEST_QUEUE_LOG_PATH)
  const raw = readJsonFile(VT_FORWARD_TEST_QUEUE_PATH)
  const active = Array.isArray(raw?.active) ? raw.active : []
  const safety =
    raw?.safety && typeof raw.safety === 'object' && !Array.isArray(raw.safety)
      ? (raw.safety as JsonRecord)
      : {}
  return {
    fileExists: Boolean(stat),
    updatedAt: stat?.mtimeMs ?? null,
    logExists: Boolean(logStat),
    logUpdatedAt: logStat?.mtimeMs ?? null,
    logEventCount: countJsonlRecords(VT_FORWARD_TEST_QUEUE_LOG_PATH),
    generatedAt:
      typeof raw?.generated_at === 'string' ? raw.generated_at : null,
    mode:
      typeof raw?.mode === 'string' ? raw.mode : 'forward_observe_queue_only',
    sourceBacktestGeneratedAt:
      typeof raw?.source_backtest_generated_at === 'string'
        ? raw.source_backtest_generated_at
        : null,
    activeCount:
      typeof raw?.active_count === 'number' ? raw.active_count : active.length,
    active,
    safety: {
      observeOnly: safety.observe_only !== false,
      executionEnabled: safety.execution_enabled === true,
      demoTradingEnabled: safety.demo_trading_enabled === true,
      liveTradingEnabled: safety.live_trading_enabled === true,
      registryMutated: safety.registry_mutated === true,
      paperPromoted: safety.paper_promoted === true,
      brokerCallsAllowed: safety.broker_calls_allowed === true,
    },
  }
}

export function readForwardPerformance(): JsonRecord {
  const stat = safeStat(VT_FORWARD_PERFORMANCE_PATH)
  const logStat = safeStat(VT_FORWARD_PERFORMANCE_LOG_PATH)
  const raw = readJsonFile(VT_FORWARD_PERFORMANCE_PATH)
  const observations = Array.isArray(raw?.observations) ? raw.observations : []
  const forwardHistory =
    raw?.forward_history &&
    typeof raw.forward_history === 'object' &&
    !Array.isArray(raw.forward_history)
      ? (raw.forward_history as JsonRecord)
      : {
          candidate_count: 0,
          eligible_count: 0,
          candidates: [],
          thresholds: {},
          safety: {},
        }
  const safety =
    raw?.safety && typeof raw.safety === 'object' && !Array.isArray(raw.safety)
      ? (raw.safety as JsonRecord)
      : {}
  return {
    fileExists: Boolean(stat),
    updatedAt: stat?.mtimeMs ?? null,
    logExists: Boolean(logStat),
    logUpdatedAt: logStat?.mtimeMs ?? null,
    logEventCount: countJsonlRecords(VT_FORWARD_PERFORMANCE_LOG_PATH),
    generatedAt:
      typeof raw?.generated_at === 'string' ? raw.generated_at : null,
    mode:
      typeof raw?.mode === 'string'
        ? raw.mode
        : 'forward_performance_observe_only',
    sourceQueueGeneratedAt:
      typeof raw?.source_queue_generated_at === 'string'
        ? raw.source_queue_generated_at
        : null,
    activeCount:
      typeof raw?.active_count === 'number'
        ? raw.active_count
        : observations.length,
    observedCount:
      typeof raw?.observed_count === 'number'
        ? raw.observed_count
        : observations.length,
    observations,
    forwardHistory,
    safety: {
      observeOnly: safety.observe_only !== false,
      executionEnabled: safety.execution_enabled === true,
      demoTradingEnabled: safety.demo_trading_enabled === true,
      liveTradingEnabled: safety.live_trading_enabled === true,
      registryMutated: safety.registry_mutated === true,
      paperPromoted: safety.paper_promoted === true,
      brokerCallsAllowed: safety.broker_calls_allowed === true,
    },
  }
}

export function readManualPaperReview(): JsonRecord {
  const stat = safeStat(VT_MANUAL_REVIEW_PATH)
  const logStat = safeStat(VT_MANUAL_REVIEW_LOG_PATH)
  const raw = readJsonFile(VT_MANUAL_REVIEW_PATH)
  const packets = Array.isArray(raw?.packets) ? raw.packets : []
  const eligible = Array.isArray(raw?.eligible) ? raw.eligible : []
  const waiting = Array.isArray(raw?.waiting) ? raw.waiting : []
  const safety =
    raw?.safety && typeof raw.safety === 'object' && !Array.isArray(raw.safety)
      ? (raw.safety as JsonRecord)
      : {}
  return {
    fileExists: Boolean(stat),
    updatedAt: stat?.mtimeMs ?? null,
    logExists: Boolean(logStat),
    logUpdatedAt: logStat?.mtimeMs ?? null,
    logEventCount: countJsonlRecords(VT_MANUAL_REVIEW_LOG_PATH),
    generatedAt:
      typeof raw?.generated_at === 'string' ? raw.generated_at : null,
    mode:
      typeof raw?.mode === 'string'
        ? raw.mode
        : 'manual_paper_review_packet_observe_only',
    sourceForwardGeneratedAt:
      typeof raw?.source_forward_generated_at === 'string'
        ? raw.source_forward_generated_at
        : null,
    packetCount:
      typeof raw?.packet_count === 'number' ? raw.packet_count : packets.length,
    eligibleCount:
      typeof raw?.eligible_count === 'number'
        ? raw.eligible_count
        : eligible.length,
    waitingCount:
      typeof raw?.waiting_count === 'number'
        ? raw.waiting_count
        : waiting.length,
    packets,
    eligible,
    waiting,
    safety: {
      observeOnly: safety.observe_only !== false,
      manualReviewRequired: safety.manual_review_required !== false,
      executionEnabled: safety.execution_enabled === true,
      demoTradingEnabled: safety.demo_trading_enabled === true,
      liveTradingEnabled: safety.live_trading_enabled === true,
      registryMutated: safety.registry_mutated === true,
      paperPromoted: safety.paper_promoted === true,
      brokerCallsAllowed: safety.broker_calls_allowed === true,
    },
  }
}

export function summarizeBacktestData(): JsonRecord {
  const stat = safeStat(VT_BACKTEST_DATA_DIR)
  const files = stat
    ? fs
        .readdirSync(VT_BACKTEST_DATA_DIR)
        .filter((name) => name.endsWith('.json'))
        .sort()
    : []
  return {
    source: 'Bybit/CCXT OHLCV',
    fetcher: 'vt_capital.fetch_candles --config config/backtest-data.yaml',
    configPath: 'config/backtest-data.yaml',
    outputDir: 'data/desks/desk-a-swing',
    fileExists: Boolean(stat),
    fileCount: files.length,
    files: files.slice(0, 12),
    symbols: ['BTC', 'ETH', 'SOL'],
    timeframes: ['5m', '15m', '1h', '4h', '1d', '1w', '1M'],
    limitation:
      'Dati pubblici Bybit via CCXT, observe-only. 35m viene ricampionato da 5m; servono ancora walk-forward, split out-of-sample e logica strategia dedicata.',
    nextSource: 'Strategy-specific loaders + walk-forward cache',
  }
}

export function summarizeShadowAudit(
  records: Array<JsonRecord>,
  eventCount: number,
  updatedAt: number | null,
): JsonRecord {
  const last = records.at(-1) ?? null
  const payload = payloadOf(last) ?? {}
  return {
    fileExists: eventCount > 0,
    updatedAt,
    eventCount,
    lastEventType:
      typeof last?.event_type === 'string' ? last.event_type : null,
    lastTimestamp: typeof last?.ts === 'string' ? last.ts : null,
    namespace:
      typeof payload.audit_namespace === 'string'
        ? payload.audit_namespace
        : null,
    mode: typeof payload.mode === 'string' ? payload.mode : null,
    executionEnabled:
      typeof payload.execution_enabled === 'boolean'
        ? payload.execution_enabled
        : null,
    brokerSupplied:
      typeof payload.broker_supplied === 'boolean'
        ? payload.broker_supplied
        : null,
    recent: records.slice(-5),
  }
}

export const Route = createFileRoute('/api/vt-capital')({
  server: {
    handlers: {
      GET: ({ request }) => {
        if (!isAuthenticated(request))
          return json({ ok: false, error: 'Unauthorized' }, { status: 401 })
        const biasRecords = readLastLines(HOURLY_BIAS_PATH, 10)
        const precheckRecords = readLastLines(PRECHECK_PATH, 12)
        const proposedRecords = readLastLines(VT_ORDER_PROPOSED_PATH, 10)
        const executedRecords = readLastLines(VT_ORDER_EXECUTED_PATH, 10)
        const shadowRecords = readLastLines(VT_SHADOW_AUDIT_PATH, 10)
        const strategyTestLogRecords = readLastLines(
          VT_STRATEGY_TEST_LOG_PATH,
          80,
        )
        const shadowStat = safeStat(VT_SHADOW_AUDIT_PATH)
        const strategyTestLogStat = safeStat(VT_STRATEGY_TEST_LOG_PATH)
        const shadowEventCount = countJsonlRecords(VT_SHADOW_AUDIT_PATH)
        const strategyTestLogCount = countJsonlRecords(
          VT_STRATEGY_TEST_LOG_PATH,
        )
        const biasStat = safeStat(HOURLY_BIAS_PATH)
        const precheckStat = safeStat(PRECHECK_PATH)
        const { lastRiskCheck, lastOrderProposed, lastOrderExecuted } =
          resolveGuardianOrderEvents(proposedRecords, executedRecords)
        const demoState = readJsonFile(VT_DEMO_STATE_PATH)
        const latestMarketBias = summarizeLatestBias(biasRecords)
        return json({
          ok: true,
          checkedAt: Date.now(),
          plugin: {
            name: 'vt-capital',
            version: '0.1.0',
            mode: 'observe_only',
            executionEnabled: false,
          },
          paths: {
            vault: '/root/hermes-vault',
            tradingNotes: TRADING_NOTES_DIR,
            hourlyBias: HOURLY_BIAS_PATH,
            councilPrecheck: PRECHECK_PATH,
            shadowAudit: VT_SHADOW_AUDIT_PATH,
            profilesDir: getProfilesDir(),
            autoresearchConfig: VT_AUTORESEARCH_CONFIG_PATH,
            backtestData: VT_BACKTEST_DATA_DIR,
            strategyRegistry: VT_STRATEGY_REGISTRY_PATH,
            backtestResults: VT_BACKTEST_RESULTS_PATH,
            strategyTestLog: VT_STRATEGY_TEST_LOG_PATH,
            forwardTestQueue: VT_FORWARD_TEST_QUEUE_PATH,
            forwardTestQueueLog: VT_FORWARD_TEST_QUEUE_LOG_PATH,
            forwardPerformance: VT_FORWARD_PERFORMANCE_PATH,
            forwardPerformanceLog: VT_FORWARD_PERFORMANCE_LOG_PATH,
            manualPaperReview: VT_MANUAL_REVIEW_PATH,
            manualPaperReviewLog: VT_MANUAL_REVIEW_LOG_PATH,
            home: os.homedir(),
          },
          marketBias: {
            fileExists: Boolean(biasStat),
            updatedAt: biasStat?.mtimeMs ?? null,
            sizeBytes: biasStat?.size ?? 0,
            latest: latestMarketBias,
            recent: biasRecords.slice(-5),
          },
          council: {
            fileExists: Boolean(precheckStat),
            updatedAt: precheckStat?.mtimeMs ?? null,
            sizeBytes: precheckStat?.size ?? 0,
            recent: precheckRecords.slice(-8),
            history: summarizeCouncilHistory(precheckRecords),
          },
          workers: VT_WORKERS.map(readWorkerRuntime),
          autoresearch: readAutoresearchConfig(),
          strategyRegistry: readStrategyRegistry(),
          backtestResults: readBacktestResults(),
          forwardTestQueue: readForwardTestQueue(),
          forwardPerformance: readForwardPerformance(),
          manualPaperReview: readManualPaperReview(),
          strategyTestLogs: summarizeStrategyTestLogs(
            strategyTestLogRecords,
            strategyTestLogCount,
            strategyTestLogStat?.mtimeMs ?? null,
          ),
          backtestData: summarizeBacktestData(),
          shadow: summarizeShadowAudit(
            shadowRecords,
            shadowEventCount,
            shadowStat?.mtimeMs ?? null,
          ),
          guardian: {
            requireOrderScope: true,
            executionMode: 'demo_guardian',
            liveBlocked: true,
            executionEnabled: false,
            lastRiskCheck,
            lastOrderProposed,
            lastOrderExecuted,
            demoState: summariseDemoState(),
            recentBlocks: recentGuardianBlocks([
              ...proposedRecords,
              ...executedRecords,
              ...precheckRecords,
            ]),
          },
          portfolio: buildPortfolioSnapshot(demoState, {
            latest: latestMarketBias,
          }),
          notes: listRecentNotes(),
        })
      },
    },
  },
})
