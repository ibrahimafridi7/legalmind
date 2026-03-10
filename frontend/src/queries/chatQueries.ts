import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { ChatMessageWithCitations } from '../types/chat.types'

const CHAT_QUERY_KEY = 'chat'

export function chatQueryKey(sessionId: string) {
  return [CHAT_QUERY_KEY, sessionId] as const
}

/** Server-state for chat history per session. Updated via setQueryData during streaming. */
export function useChatMessages(sessionId: string) {
  return useQuery({
    queryKey: chatQueryKey(sessionId),
    queryFn: (): ChatMessageWithCitations[] => [],
    initialData: [] as ChatMessageWithCitations[],
    staleTime: Number.POSITIVE_INFINITY
  })
}

export function useChatMutation(sessionId: string) {
  const queryClient = useQueryClient()
  const key = chatQueryKey(sessionId)

  return {
    setMessages: (updater: (prev: ChatMessageWithCitations[]) => ChatMessageWithCitations[]) => {
      queryClient.setQueryData(key, updater)
    },
    getMessages: (): ChatMessageWithCitations[] =>
      queryClient.getQueryData(key) ?? []
  }
}
