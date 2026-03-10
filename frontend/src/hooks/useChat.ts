import { useEffect, useRef, useState } from 'react'
import { API_BASE_URL } from '../lib/config'
import { getAuthToken } from '../lib/auth'
import { useChatMessages, useChatMutation } from '../queries/chatQueries'
import type { ChatMessageWithCitations, Citation } from '../types/chat.types'

/** Vercel AI SDK text stream protocol: POST /api/chat returns plain text chunks. */

export type { ChatMessageWithCitations } from '../types/chat.types'

interface UseLegalChatResult {
  messages: ChatMessageWithCitations[]
  input: string
  isLoading: boolean
  isStreaming: boolean
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
}

export const useLegalChat = (sessionId: string): UseLegalChatResult => {
  const { data: messages = [] } = useChatMessages(sessionId)
  const { setMessages } = useChatMutation(sessionId)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const handleInputChange: UseLegalChatResult['handleInputChange'] = (e) => {
    setInput(e.target.value)
  }

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const handleSubmit: UseLegalChatResult['handleSubmit'] = async (e) => {
    e.preventDefault()
    if (!input.trim()) return
    const q = input
    const userMessage: ChatMessageWithCitations = { id: crypto.randomUUID(), role: 'user', content: q }
    setInput('')
    setIsLoading(true)
    setIsStreaming(true)

    const assistantId = crypto.randomUUID()
    setMessages((prev) => [
      ...prev,
      userMessage,
      { id: assistantId, role: 'assistant', content: '' }
    ])

    abortRef.current?.abort()
    const ac = new AbortController()
    abortRef.current = ac

    const appendDelta = (delta: string) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + delta } : m))
      )
    }

    const setAssistantContent = (content: string) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, content } : m))
      )
    }

    const setAssistantCitations = (citations: Citation[]) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, citations } : m))
      )
    }

    const messagesForApi = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: 'user' as const, content: q }
    ]

    try {
      const token = await getAuthToken()
      const headers: HeadersInit = { 'Content-Type': 'application/json' }
      if (token) headers['Authorization'] = `Bearer ${token}`

      const res = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        signal: ac.signal,
        headers,
        body: JSON.stringify({ messages: messagesForApi })
      })
      if (!res.ok || !res.body) throw new Error(`Chat stream failed (${res.status})`)

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })
        fullText += chunk
        appendDelta(chunk)
      }

      setIsStreaming(false)
      const citations: Citation[] = [
        { id: 'c1', documentId: 'doc1', page: 1, snippet: 'Sample snippet from the document.' },
        { id: 'c2', documentId: 'doc1', page: 2, snippet: 'Another relevant passage for the answer.' }
      ]
      setAssistantCitations(citations)
    } catch {
      setAssistantContent('Network error. Please retry.')
    } finally {
      setIsLoading(false)
      setIsStreaming(false)
    }
  }

  return { messages, input, isLoading, isStreaming, handleInputChange, handleSubmit }
}

