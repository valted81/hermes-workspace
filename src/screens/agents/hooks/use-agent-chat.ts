import { useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { SessionHistoryMessage } from '@/lib/gateway-api'
import {
  fetchSessionHistory,
  sendToSession,
} from '@/lib/gateway-api'

export type OperationsChatMessage = {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp?: number
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

function extractMessageText(message: SessionHistoryMessage): string {
  if (typeof message.content === 'string') return message.content
  if (Array.isArray(message.content)) {
    return message.content
      .map((part) => {
        if (typeof part !== 'object') return safeDisplayValue(part)
        if (!part.type || part.type === 'text') {
          return typeof part.text === 'string' ? part.text : safeDisplayValue(part)
        }
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
  return safeDisplayValue(message.content)
}

function normalizeMessage(
  message: SessionHistoryMessage,
  index: number,
): OperationsChatMessage | null {
  const content = extractMessageText(message).trim()
  if (!content) return null

  const role =
    message.role === 'assistant'
      ? 'assistant'
      : message.role === 'user'
        ? 'user'
        : 'system'

  return {
    id: `${role}-${message.timestamp ?? index}-${index}`,
    role,
    content,
    timestamp: message.timestamp,
  }
}

export function useAgentChat(sessionKey: string) {
  const queryClient = useQueryClient()

  const historyQuery = useQuery({
    queryKey: ['operations', 'chat', sessionKey],
    queryFn: async () => {
      try {
        // Try the ClawSuite history endpoint first (uses sessionKey param)
        const res = await fetch(`/api/history?sessionKey=${encodeURIComponent(sessionKey)}&limit=50`)
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data.messages)) return data.messages as Array<SessionHistoryMessage>
        }
      } catch {
        // fall through
      }
      // Fallback to gateway-api
      const response = await fetchSessionHistory(sessionKey, { limit: 50 })
      if (response.ok === false) return []
      return Array.isArray(response.messages) ? response.messages : []
    },
    refetchInterval: 5_000,
    enabled: Boolean(sessionKey),
  })

  const sendMutation = useMutation({
    mutationFn: async (message: string) => {
      await sendToSession(sessionKey, message)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ['operations', 'chat', sessionKey],
      })
      await queryClient.invalidateQueries({
        queryKey: ['operations', 'sessions'],
      })
    },
  })

  const messages = useMemo(
    () =>
      (historyQuery.data ?? [])
        .map(normalizeMessage)
        .filter((message): message is OperationsChatMessage => Boolean(message)),
    [historyQuery.data],
  )

  return {
    messages,
    sendMessage: sendMutation.mutateAsync,
    isLoading: historyQuery.isPending,
    isRefreshing: historyQuery.isFetching,
    isSending: sendMutation.isPending,
    error:
      (historyQuery.error instanceof Error && historyQuery.error.message) ||
      (sendMutation.error instanceof Error && sendMutation.error.message) ||
      null,
    refresh: historyQuery.refetch,
  }
}
