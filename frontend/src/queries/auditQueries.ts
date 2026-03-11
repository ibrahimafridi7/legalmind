import { useQuery } from '@tanstack/react-query'
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

export const useAuditLogs = (limit = 100) =>
  useQuery({
    queryKey: ['audit-logs', limit],
    queryFn: async () => {
      const { data } = await api.get<AuditLogDto[]>('/api/audit-logs', { params: { limit } })
      return data
    },
    refetchInterval: 5000
  })

