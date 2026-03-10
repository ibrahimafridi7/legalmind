import { create } from 'zustand'

interface UIStore {
  sidebarOpen: boolean
  activePdfPage: number
  highlightedCitation: string | null
  toggleSidebar: () => void
  setHighlight: (id: string | null) => void
  setActivePdfPage: (page: number) => void
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  activePdfPage: 1,
  highlightedCitation: null,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setHighlight: (id) => set({ highlightedCitation: id }),
  setActivePdfPage: (page) => set({ activePdfPage: page })
}))

