import { create } from 'zustand'
import type { User } from '../types/user.types'

interface SessionStore {
  user: User | null
  token: string | null
  activeSessionId: string | null
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setActiveSessionId: (id: string | null) => void
}

export const useSessionStore = create<SessionStore>((set) => ({
  user: null,
  token: null,
  activeSessionId: null,
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  setActiveSessionId: (id) => set({ activeSessionId: id })
}))

