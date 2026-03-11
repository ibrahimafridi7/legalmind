import { NavLink } from 'react-router-dom'
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
      <span>Sign out</span>
    </button>
  )
}

export const Sidebar = () => {
  const { sidebarOpen, toggleSidebar } = useUIStore()

  const panel = (
    <>
      <div className="flex items-center gap-2 px-3 py-3">
        <Button variant="ghost" size="icon" aria-label="Toggle sidebar" onClick={toggleSidebar}>
          <PanelLeft className="h-5 w-5" />
        </Button>
        {sidebarOpen && (
          <>
            <span className="text-sm font-semibold tracking-wide text-slate-100">LegalMind AI</span>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="About" className="ml-auto">
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
      <nav className="flex-1 px-2 text-sm">
        <SidebarLink to="/chat" label="Chat" onClick={toggleSidebar} />
        <SidebarLink to="/documents" label="Documents" onClick={toggleSidebar} />
        <SidebarLink to="/audit-logs" label="Audit Logs" onClick={toggleSidebar} />
      </nav>
      {isAuth0Enabled && (
        <div className="border-t border-slate-800 px-2 py-2">
          <SidebarLogout />
        </div>
      )}
    </>
  )

  return (
    <>
      {/* Hamburger: visible only on tablet/small (below lg), when sidebar is closed */}
      <Button
        variant="ghost"
        size="icon"
        aria-label="Open menu"
        onClick={toggleSidebar}
        className="fixed left-3 top-3 z-30 lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Desktop (lg+): sidebar in flow, collapsible to narrow */}
      <aside
        className={`hidden h-screen flex-col border-r border-slate-800 bg-brand-surface/80 backdrop-blur transition-all lg:flex ${
          sidebarOpen ? 'w-64' : 'w-16'
        }`}
      >
        {panel}
      </aside>

      {/* Tablet/mobile: overlay sidebar */}
      <div
        aria-hidden={sidebarOpen}
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity lg:hidden ${sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={sidebarOpen ? toggleSidebar : undefined}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-800 bg-brand-surface shadow-xl transition-transform lg:hidden ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Main navigation"
      >
        {panel}
      </aside>
    </>
  )
}

const SidebarLink = ({ to, label, onClick }: { to: string; label: string; onClick?: () => void }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center rounded-md px-3 py-2 outline-none focus:ring-2 focus:ring-brand-action focus:ring-inset ${isActive ? 'bg-brand-action text-white' : 'text-brand-muted hover:bg-slate-800 hover:text-slate-100'}`
  }
  >
    <span>{label}</span>
  </NavLink>
)

