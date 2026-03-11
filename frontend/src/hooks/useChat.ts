import { useEffect, useState, useMemo } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { API_BASE_URL } from '../lib/config'
import { getAuthToken } from '../lib/auth'
import { useChatMessages, useChatMutation } from '../queries/chatQueries'
import type { ChatMessageWithCitations, Citation } from '../types/chat.types'

export type { ChatMessageWithCitations } from '../types/chat.types'

/** Map SDK UIMessage parts to our ChatMessageWithCitations shape. */
function uiMessageToOurMessage(msg: { id: string; role: string; parts?: Array<{ type: string; text?: string; data?: Citation[] }> }): ChatMessageWithCitations {
  const parts = Array.isArray(msg.parts) ? msg.parts : []
  const content = parts
    .filter((p): p is { type: string; text: string } => p.type === 'text' && typeof p.text === 'string')
    .map((p) => p.text)
    .join('')
  const citationsPart = parts.find((p) => p.type === 'data-citations' && Array.isArray(p.data))
  const citations = citationsPart?.data as Citation[] | undefined
  return {
    id: msg.id,
    role: msg.role === 'user' ? 'user' : 'assistant',
    content,
    ...(citations?.length ? { citations } : {})
  }
}

/** Map our messages to UIMessage shape for useChat initial/hydration. */
function ourMessagesToUIMessages(messages: ChatMessageWithCitations[]): Array<{ id: string; role: 'user' | 'assistant'; parts: Array<{ type: 'text'; text: string } | { type: 'data-citations'; data: Citation[] }> }> {
  return messages.map((m) => ({
    id: m.id,
    role: m.role,
    parts: [
      { type: 'text' as const, text: m.content ?? '' },
      ...(m.citations?.length ? [{ type: 'data-citations' as const, data: m.citations }] : [])
    ]
  }))
}

interface UseLegalChatResult {
  messages: ChatMessageWithCitations[]
  input: string
  isLoading: boolean
  isStreaming: boolean
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
}

export const useLegalChat = (sessionId: string): UseLegalChatResult => {
  const { data: storedMessages = [] } = useChatMessages(sessionId)
  const { setMessages: setPersistenceMessages } = useChatMutation(sessionId)
  const [input, setInput] = useState('')

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `${API_BASE_URL}/api/chat`,
        body: { sessionId },
        fetch: async (input, init) => {
          const token = await getAuthToken()
          const headers = new Headers(init?.headers)
          if (token) headers.set('Authorization', `Bearer ${token}`)
          return fetch(input, { ...init, headers })
        }
      }),
    [sessionId]
  )

  const {
    messages: sdkMessages,
    sendMessage,
    setMessages: setSdkMessages,
    status
  } = useChat({
    id: sessionId,
    transport
  })

  const messages: ChatMessageWithCitations[] = useMemo(
    () => sdkMessages.map(uiMessageToOurMessage),
    [sdkMessages]
  )

  const isLoading = status === 'submitted'
  const isStreaming = status === 'streaming'

  useEffect(() => {
    if (storedMessages.length > 0 && sdkMessages.length === 0) {
      setSdkMessages(ourMessagesToUIMessages(storedMessages))
    }
  }, [storedMessages, sdkMessages.length, setSdkMessages])

  useEffect(() => {
    if (messages.length === 0) return
    setPersistenceMessages(() => messages)
  }, [messages, setPersistenceMessages])

  const handleInputChange: UseLegalChatResult['handleInputChange'] = (e) => {
    setInput(e.target.value)
  }

  const handleSubmit: UseLegalChatResult['handleSubmit'] = (e) => {
    e.preventDefault()
    if (!input.trim()) return
    const text = input.trim()
    setInput('')
    sendMessage({ text }, { body: { sessionId } })
  }

  return { messages, input, isLoading, isStreaming, handleInputChange, handleSubmit }
}
