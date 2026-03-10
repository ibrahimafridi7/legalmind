export interface DocumentSummary {
  id: string
  name: string
  uploadedAt: string
  status: 'pending' | 'indexing' | 'ready' | 'failed'
  pages?: number
}

