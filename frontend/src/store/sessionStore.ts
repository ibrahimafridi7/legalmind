import { create } from 'zustand'
import type { User } from '../types/user.types'

const SESSIONS_STORAGE_KEY = 'legalmind_chat_sessions'

export interface ChatSessionMeta {
  id: string
  name: string
  pinned: boolean
  archived: boolean
  createdAt: string
  updatedAt: string
}

function loadInitialSessions(): ChatSessionMeta[] {
  if (typeof window === 'undefined') {
    return [
      {
        id: 'demo',
        name: 'Demo chat',
        pinned: true,
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  }
  try {
    const raw = window.localStorage.getItem(SESSIONS_STORAGE_KEY)
    if (!raw) {
      const now = new Date().toISOString()
      return [
        { id: 'demo', name: 'Demo chat', pinned: true, archived: false, createdAt: now, updatedAt: now }
      ]
    }
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) throw new Error('invalid')
    const cleaned = parsed
      .filter((s): s is ChatSessionMeta => s && typeof s.id === 'string' && typeof s.name === 'string')
      .map((s) => ({
        id: s.id,
        name: s.name,
        pinned: Boolean(s.pinned),
        archived: Boolean(s.archived),
        createdAt: s.createdAt ?? new Date().toISOString(),
        updatedAt: s.updatedAt ?? s.createdAt ?? new Date().toISOString()
      }))
    if (cleaned.length === 0) {
      const now = new Date().toISOString()
      return [
        { id: 'demo', name: 'Demo chat', pinned: true, archived: false, createdAt: now, updatedAt: now }
      ]
    }
    return cleaned
  } catch {
    const now = new Date().toISOString()
    return [
      { id: 'demo', name: 'Demo chat', pinned: true, archived: false, createdAt: now, updatedAt: now }
    ]
  }
}

function persistSessions(sessions: ChatSessionMeta[]) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions))
  } catch {
    // ignore quota errors
  }
}

interface SessionStore {
  user: User | null
  token: string | null
  activeSessionId: string | null
  sessions: ChatSessionMeta[]
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  setActiveSessionId: (id: string | null) => void
  createSession: () => string
  archiveSession: (id: string) => void
  togglePinSession: (id: string) => void
}

export const useSessionStore = create<SessionStore>((set, get) => {
  const initialSessions = loadInitialSessions()
  return {
    user: null,
    token: null,
    activeSessionId: initialSessions[0]?.id ?? null,
    sessions: initialSessions,
    setUser: (user) => set({ user }),
    setToken: (token) => set({ token }),
    setActiveSessionId: (id) => set({ activeSessionId: id }),
    createSession: () => {
      const id = crypto.randomUUID()
      const now = new Date().toISOString()
      const next: ChatSessionMeta = {
        id,
        name: 'New chat',
        pinned: false,
        archived: false,
        createdAt: now,
        updatedAt: now
      }
      const sessions = [...get().sessions, next]
      persistSessions(sessions)
      set({ sessions, activeSessionId: id })
      return id
    },
    archiveSession: (id) => {
      const sessions = get().sessions.map((s) =>
        s.id === id ? { ...s, archived: true, updatedAt: new Date().toISOString() } : s
      )
      persistSessions(sessions)
      const state: Partial<SessionStore> = { sessions }
      if (get().activeSessionId === id) {
        const firstActive = sessions.find((s) => !s.archived)
        state.activeSessionId = firstActive ? firstActive.id : null
      }
      set(state)
    },
    togglePinSession: (id) => {
      const sessions = get().sessions.map((s) =>
        s.id === id ? { ...s, pinned: !s.pinned, updatedAt: new Date().toISOString() } : s
      )
      persistSessions(sessions)
      set({ sessions })
    }
  }
})


