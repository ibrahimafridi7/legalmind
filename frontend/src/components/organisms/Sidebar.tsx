import { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useUIStore } from '../../store/uiStore'
import { useSessionStore } from '../../store/sessionStore'
import { Button } from '../ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../ui/dialog'
import { PanelLeft, LogOut, Info, Menu, Plus, Star, Archive } from 'lucide-react'
import { useAuth0 } from '@auth0/auth0-react'
import { isAuth0Enabled } from '../../lib/auth'

function SidebarLogout() {
  const { logout } = useAuth0()
  return (
    <button
      type="button"
      onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-brand-muted hover:bg-slate-800 hover:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-action focus:ring-inset"
    >
      <LogOut className="h-4 w-4 shrink-0" />
      <span className="truncate">Sign out</span>
    </button>
  )
}

export const Sidebar = () => {
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUIStore()
  const location = useLocation()
  const { activeSessionId, sessions, setActiveSessionId, createSession, togglePinSession, archiveSession } =
    useSessionStore()

  // Close overlay on route change only on tablet/mobile (overlay mode) so it doesn't stick
  useEffect(() => {
    const isOverlayMode = typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches
    if (isOverlayMode) setSidebarOpen(false)
  }, [location.pathname, setSidebarOpen])

  // Lock body scroll when overlay is open (tablet/mobile)
  useEffect(() => {
    if (!sidebarOpen) return
    const isSmall = typeof window !== 'undefined' && window.matchMedia('(max-width: 1023px)').matches
    if (!isSmall) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [sidebarOpen])

  // Escape closes overlay on tablet/mobile
  useEffect(() => {
    if (!sidebarOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [sidebarOpen, setSidebarOpen])

  const panel = (
    <>
      <div className="flex min-w-0 items-center gap-2 px-3 py-3">
        <Button variant="ghost" size="icon" aria-label="Toggle sidebar" onClick={toggleSidebar} className="shrink-0">
          <PanelLeft className="h-5 w-5" />
        </Button>
        {sidebarOpen && (
          <>
            <span className="min-w-0 truncate text-sm font-semibold tracking-wide text-slate-100">LegalMind AI</span>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="About" className="ml-auto shrink-0">
                  <Info className="h-4 w-4 text-brand-muted" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                  <DialogTitle>About LegalMind AI</DialogTitle>
                  <DialogDescription>
                    Legal research and document assistant. Chat, upload documents, and view audit logs. Built with React, TanStack Query, Zustand, and Shadcn/UI (Radix primitives).
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </>
        )}
      </div>
      <nav className="flex min-w-0 flex-1 flex-col overflow-hidden px-2 text-sm">
        <SidebarLink to="/chat" label="Chat" />
        <SidebarLink to="/documents" label="Documents" />
        <SidebarLink to="/audit-logs" label="Audit Logs" />
        <div className="mt-4 border-t border-slate-800 pt-3">
          <div className="mb-2 flex items-center justify-between px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>Conversations</span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="h-6 w-6"
              aria-label="New chat"
              onClick={() => {
                const id = createSession()
                setActiveSessionId(id)
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <div className="flex max-h-40 flex-col gap-1 overflow-auto pr-1 text-xs">
            {sessions
              .filter((s) => !s.archived)
              .sort((a, b) => {
                if (a.pinned && !b.pinned) return -1
                if (!a.pinned && b.pinned) return 1
                return b.updatedAt.localeCompare(a.updatedAt)
              })
              .map((s) => {
                const isActive = s.id === activeSessionId
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setActiveSessionId(s.id)}
                    className={`flex w-full items-center gap-2 rounded-md px-2 py-1 text-left transition ${
                      isActive ? 'bg-slate-800 text-slate-100' : 'text-brand-muted hover:bg-slate-900 hover:text-slate-100'
                    }`}
                  >
                    <span className="truncate">{s.name}</span>
                    {s.pinned && <Star className="h-3 w-3 text-amber-400 shrink-0" />}
                    <span className="ml-auto flex items-center gap-1 opacity-70">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          togglePinSession(s.id)
                        }}
                        aria-label={s.pinned ? 'Unpin chat' : 'Pin chat'}
                        className="rounded p-0.5 hover:bg-slate-800"
                      >
                        <Star
                          className={`h-3 w-3 ${s.pinned ? 'text-amber-400' : 'text-slate-500'}`}
                          fill={s.pinned ? 'currentColor' : 'none'}
                        />
                      </button>
                      {s.id !== 'demo' && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            archiveSession(s.id)
                          }}
                          aria-label="Archive chat"
                          className="rounded p-0.5 hover:bg-slate-800"
                        >
                          <Archive className="h-3 w-3 text-slate-500" />
                        </button>
                      )}
                    </span>
                  </button>
                )
              })}
            {sessions.filter((s) => !s.archived).length === 0 && (
              <div className="px-1 py-1 text-[11px] text-brand-muted">No active chats. Start a new one.</div>
            )}
          </div>
        </div>
      </nav>
      {isAuth0Enabled && (
        <div className="shrink-0 border-t border-slate-800 px-2 py-2">
          <SidebarLogout />
        </div>
      )}
    </>
  )

  return (
    <>
      {/* Hamburger: only on tablet/small (below lg) */}
      <Button
        variant="ghost"
        size="icon"
        aria-label="Open menu"
        onClick={toggleSidebar}
        className="fixed left-3 top-3 z-30 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Desktop (lg+): sidebar in flow, collapsible */}
      <aside
        className={`hidden h-screen flex-col border-r border-slate-800 bg-brand-surface/80 backdrop-blur transition-all lg:flex ${
          sidebarOpen ? 'w-64' : 'w-16'
        }`}
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{panel}</div>
      </aside>

      {/* Tablet/mobile: backdrop – click or Escape to close */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Close menu"
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden ${sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={() => sidebarOpen && setSidebarOpen(false)}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800 bg-brand-surface shadow-xl transition-transform lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Main navigation"
      >
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{panel}</div>
      </aside>
    </>
  )
}

const SidebarLink = ({ to, label }: { to: string; label: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-brand-action focus:ring-inset ${isActive ? 'bg-brand-action text-white' : 'text-brand-muted hover:bg-slate-800 hover:text-slate-100'}`
  }
  >
    <span className="truncate">{label}</span>
  </NavLink>
)

