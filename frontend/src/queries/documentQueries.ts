import { useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../lib/api'
import { API_BASE_URL } from '../lib/config'
import { getAuthToken } from '../lib/auth'
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

/** Subscribe to SSE document status stream; invalidates documents list when a doc becomes ready/failed. */
export function useDocumentStatusStream(enabled = true) {
  const queryClient = useQueryClient()
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  useEffect(() => {
    if (!enabledRef.current) return
    const ac = new AbortController()
    let buffer = ''

    const run = async () => {
      const token = await getAuthToken()
      const url = `${API_BASE_URL}/api/documents/status-stream`
      const res = await fetch(url, {
        signal: ac.signal,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      }).catch(() => null)
      if (!res?.ok || !res.body) return
      const reader = res.body.getReader()
      const dec = new TextDecoder()
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        buffer += dec.decode(value, { stream: true })
        const parts = buffer.split('\n\n')
        buffer = parts.pop() ?? ''
        for (const block of parts) {
          const event = block.match(/event:\s*(\S+)/)?.[1]
          const dataLine = block.match(/data:\s*(.+)/s)?.[1]?.trim()
          if (event === 'document_indexed' && dataLine) {
            try {
              JSON.parse(dataLine)
              queryClient.invalidateQueries({ queryKey: ['documents'] })
            } catch {
              /* ignore */
            }
          }
        }
      }
    }
    run()
    return () => ac.abort()
  }, [queryClient])

  return null
}

type PresignRequest = { filename: string; contentType: string; sizeBytes?: number }
export type PresignResponse = {
  documentId: string
  uploadUrl: string
  method: 'PUT'
  headers: Record<string, string>
  /** When present (e.g. S3), client must POST here after successful upload. */
  uploadCompleteEndpoint?: string
}

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

