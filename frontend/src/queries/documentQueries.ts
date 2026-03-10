import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import type { DocumentSummary } from '../types/document.types'

export const useDocuments = () =>
  useQuery({
    queryKey: ['documents'],
    queryFn: async () => {
      const { data } = await api.get<DocumentSummary[]>('/api/documents')
      return data
    },
    refetchInterval: 2000
  })

type PresignRequest = { filename: string; contentType: string; sizeBytes?: number }
type PresignResponse = { documentId: string; uploadUrl: string; method: 'PUT'; headers: Record<string, string> }

export const usePresignUpload = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (req: PresignRequest) => {
      const { data } = await api.post<PresignResponse>('/api/documents/presign', req)
      return data
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['documents'] })
    }
  })
}

export const useDocument = (documentId: string | null) =>
  useQuery({
    enabled: Boolean(documentId),
    queryKey: ['document', documentId],
    queryFn: async () => {
      const { data } = await api.get<DocumentSummary>(`/api/documents/${documentId}`)
      return data
    },
    refetchInterval: 1000
  })

