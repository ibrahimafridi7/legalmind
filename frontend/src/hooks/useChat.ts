import { useChat as useVercelChat } from 'ai/react'

export const useLegalChat = (sessionId: string) =>
  useVercelChat({
    api: '/api/chat',
    id: sessionId
  })

