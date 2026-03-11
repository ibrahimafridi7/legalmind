import { create } from 'zustand'

interface UIStore {
  sidebarOpen: boolean
  activePdfPage: number
  highlightedCitation: string | null
  /** PDF URL to show in viewer (from selected citation's document). */
  selectedPdfUrl: string | null
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  setHighlight: (id: string | null) => void
  setActivePdfPage: (page: number) => void
  setSelectedPdfUrl: (url: string | null) => void
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarOpen: true,
  activePdfPage: 1,
  highlightedCitation: null,
  selectedPdfUrl: null,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setHighlight: (id) => set({ highlightedCitation: id }),
  setActivePdfPage: (page) => set({ activePdfPage: page }),
  setSelectedPdfUrl: (url) => set({ selectedPdfUrl: url })
}))

