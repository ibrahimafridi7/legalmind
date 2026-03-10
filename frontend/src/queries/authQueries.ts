import { useQuery } from '@tanstack/react-query'
import api from '../lib/api'
import type { User } from '../types/user.types'

export const useMe = () =>
  useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const { data } = await api.get<User>('/api/auth/me')
      return data
    },
    staleTime: 60_000
  })

