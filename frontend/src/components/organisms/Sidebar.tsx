import { NavLink } from 'react-router-dom'
import { useUIStore } from '../../store/uiStore'
import { Button } from '../ui/button'
import { PanelLeft } from 'lucide-react'

export const Sidebar = () => {
  const { sidebarOpen, toggleSidebar } = useUIStore()

  return (
    <aside
      className={`h-screen border-r border-slate-800 bg-brand-surface/80 backdrop-blur ${
        sidebarOpen ? 'w-64' : 'w-16'
      } transition-all`}
    >
      <div className="flex items-center gap-2 px-3 py-3">
        <Button variant="ghost" size="icon" aria-label="Toggle sidebar" onClick={toggleSidebar}>
          <PanelLeft className="h-5 w-5" />
        </Button>
        {sidebarOpen && <span className="text-sm font-semibold tracking-wide text-slate-100">LegalMind AI</span>}
      </div>
      <nav className="px-2 text-sm">
        <SidebarLink to="/chat" label="Chat" />
        <SidebarLink to="/documents" label="Documents" />
        <SidebarLink to="/audit-logs" label="Audit Logs" />
      </nav>
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

