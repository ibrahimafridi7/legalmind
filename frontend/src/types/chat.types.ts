export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
  citations?: Citation[]
}

export interface Citation {
  id: string
  documentId: string
  page: number
  snippet: string
}

