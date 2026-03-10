import { useState } from 'react'

interface UseLegalChatResult {
  messages: { id: string; role: 'user' | 'assistant'; content: string }[]
  input: string
  isLoading: boolean
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
}

export const useLegalChat = (_sessionId: string): UseLegalChatResult => {
  const [messages, setMessages] = useState<UseLegalChatResult['messages']>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange: UseLegalChatResult['handleInputChange'] = (e) => {
    setInput(e.target.value)
  }

  const handleSubmit: UseLegalChatResult['handleSubmit'] = async (e) => {
    e.preventDefault()
    if (!input.trim()) return
    const userMessage = { id: crypto.randomUUID(), role: 'user' as const, content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    // Placeholder echo response so UI works without backend wiring
    const assistantMessage = {
      id: crypto.randomUUID(),
      role: 'assistant' as const,
      content: 'This is a placeholder response. Wire this hook to your /api/chat SSE endpoint.'
    }
    setTimeout(() => {
      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 400)
  }

  return { messages, input, isLoading, handleInputChange, handleSubmit }
}

