export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  createdAt: string
  citations?: Citation[]
}

/** Used by chat UI + TanStack Query (minimal shape, no createdAt). */
export interface ChatMessageWithCitations {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
}

export interface Citation {
  id: string
  documentId: string
  docName?: string
  page: number
  snippet: string
}

