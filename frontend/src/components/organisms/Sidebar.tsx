import { useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useUIStore } from '../../store/uiStore'
import { Button } from '../ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '../ui/dialog'
import { PanelLeft, LogOut, Info, Menu } from 'lucide-react'
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

