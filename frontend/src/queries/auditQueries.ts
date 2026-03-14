import { useInfiniteQuery } from '@tanstack/react-query'
import api from '../lib/api'

export interface AuditLogDto {
  id: string
  at: string
  actorEmail: string
  actorId?: string
  action: string
  metadata?: Record<string, unknown>
  ip?: string
}

export const AUDIT_ACTIONS = [
  'LOGIN',
  'UPLOAD_DOCUMENT',
  'VIEW_DOCUMENT',
  'DELETE_DOCUMENT',
  'CHAT_QUERY',
  'document.list',
  'document.indexed'
] as const

interface AuditLogsResponse {
  logs: AuditLogDto[]
  nextCursor?: string
}

export function useAuditLogs(params: {
  limit?: number
  action?: string
  actorEmail?: string
}) {
  const { limit = 100, action, actorEmail } = params

  return useInfiniteQuery({
    queryKey: ['audit-logs', limit, action ?? '', actorEmail ?? ''],
    queryFn: async ({ pageParam }) => {
      const { data } = await api.get<AuditLogsResponse>('/api/audit-logs', {
        params: { limit, cursor: pageParam, action, actorEmail }
      })
      return data
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    refetchInterval: 5000
  })
}
