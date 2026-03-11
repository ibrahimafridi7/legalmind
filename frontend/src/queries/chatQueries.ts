import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { ChatMessageWithCitations } from '../types/chat.types'

const CHAT_QUERY_KEY = 'chat'
const CHAT_STORAGE_PREFIX = 'legalmind_chat_'
const MAX_PERSISTED_MESSAGES = 500

/** Base URL for API; must be set in fetch so it works in queryFn. */
const getApiBase = () => (typeof import.meta !== 'undefined' && (import.meta as { env?: { VITE_API_BASE_URL?: string } }).env?.VITE_API_BASE_URL) || 'http://localhost:8787'

export function chatQueryKey(sessionId: string) {
  return [CHAT_QUERY_KEY, sessionId] as const
}

function storageKey(sessionId: string) {
  return CHAT_STORAGE_PREFIX + sessionId
}

function getStoredMessages(sessionId: string): ChatMessageWithCitations[] {
  if (typeof window === 'undefined' || !sessionId) return []
  try {
    const raw = localStorage.getItem(storageKey(sessionId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter(
      (m): m is ChatMessageWithCitations =>
        m != null &&
        typeof m === 'object' &&
        typeof (m as ChatMessageWithCitations).id === 'string' &&
        ((m as ChatMessageWithCitations).role === 'user' || (m as ChatMessageWithCitations).role === 'assistant') &&
        typeof (m as ChatMessageWithCitations).content === 'string'
    )
  } catch {
    return []
  }
}

function setStoredMessages(sessionId: string, messages: ChatMessageWithCitations[]) {
  if (typeof window === 'undefined' || !sessionId) return
  try {
    const toStore = messages.length > MAX_PERSISTED_MESSAGES
      ? messages.slice(-MAX_PERSISTED_MESSAGES)
      : messages
    localStorage.setItem(storageKey(sessionId), JSON.stringify(toStore))
  } catch {
    // ignore quota or parse errors
  }
}

/** Fetch messages from server when DB is configured; else fallback to localStorage. */
async function fetchMessagesFromApi(sessionId: string): Promise<ChatMessageWithCitations[] | null> {
  try {
    const base = getApiBase()
    const res = await fetch(`${base}/api/chat/sessions/${encodeURIComponent(sessionId)}/messages`)
    if (res.status !== 200) return null
    const data = (await res.json()) as unknown
    if (!Array.isArray(data)) return null
    return data.filter(
      (m): m is ChatMessageWithCitations =>
        m != null &&
        typeof m === 'object' &&
        typeof (m as ChatMessageWithCitations).id === 'string' &&
        ((m as ChatMessageWithCitations).role === 'user' || (m as ChatMessageWithCitations).role === 'assistant') &&
        typeof (m as ChatMessageWithCitations).content === 'string'
    )
  } catch {
    return null
  }
}

/** Chat history: server (PostgreSQL) when DATABASE_URL set, else localStorage. */
export function useChatMessages(sessionId: string) {
  return useQuery({
    queryKey: chatQueryKey(sessionId),
    queryFn: async (): Promise<ChatMessageWithCitations[]> => {
      const fromApi = await fetchMessagesFromApi(sessionId)
      if (fromApi != null) return fromApi
      return getStoredMessages(sessionId)
    },
    initialData: () => getStoredMessages(sessionId),
    staleTime: 60_000
  })
}

export function useChatMutation(sessionId: string) {
  const queryClient = useQueryClient()
  const key = chatQueryKey(sessionId)

  return {
    setMessages: (updater: (prev: ChatMessageWithCitations[]) => ChatMessageWithCitations[]) => {
      queryClient.setQueryData(key, (prev: ChatMessageWithCitations[] | undefined) => {
        const next = updater(prev ?? getStoredMessages(sessionId))
        setStoredMessages(sessionId, next)
        return next
      })
    },
    getMessages: (): ChatMessageWithCitations[] =>
      queryClient.getQueryData(key) ?? getStoredMessages(sessionId)
  }
}
