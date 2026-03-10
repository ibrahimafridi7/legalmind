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
import { PanelLeft, LogOut, Info } from 'lucide-react'
import { useAuth0 } from '@auth0/auth0-react'
import { isAuth0Enabled } from '../../lib/auth'

function SidebarLogout() {
  const { logout } = useAuth0()
  return (
    <button
      type="button"
      onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-brand-muted hover:bg-slate-800 hover:text-slate-100"
    >
      <LogOut className="h-4 w-4 shrink-0" />
      <span>Sign out</span>
    </button>
  )
}

export const Sidebar = () => {
  const { sidebarOpen, toggleSidebar } = useUIStore()

  return (
    <aside
      className={`flex h-screen flex-col border-r border-slate-800 bg-brand-surface/80 backdrop-blur ${
        sidebarOpen ? 'w-64' : 'w-16'
      } transition-all`}
    >
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
        <SidebarLink to="/chat" label="Chat" />
        <SidebarLink to="/documents" label="Documents" />
        <SidebarLink to="/audit-logs" label="Audit Logs" />
      </nav>
      {isAuth0Enabled && (
        <div className="border-t border-slate-800 px-2 py-2">
          <SidebarLogout />
        </div>
      )}
    </aside>
  )
}

const SidebarLink = ({ to, label }: { to: string; label: string }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center rounded-md px-3 py-2 ${isActive ? 'bg-brand-action text-white' : 'text-brand-muted hover:bg-slate-800 hover:text-slate-100'}`
    }
  >
    <span>{label}</span>
  </NavLink>
)

