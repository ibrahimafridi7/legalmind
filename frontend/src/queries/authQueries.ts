import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import type { User } from '../types/user.types'

export const useMe = (options?: { enabled?: boolean }) =>
  useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get<User>('/api/auth/me')
      return data
    },
    staleTime: 60_000,
    enabled: options?.enabled !== false,
    retry: 2,
    retryDelay: 1200
  })

