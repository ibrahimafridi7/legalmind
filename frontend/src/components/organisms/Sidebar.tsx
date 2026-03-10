import { NavLink } from 'react-router-dom'
import { useUIStore } from '../../store/uiStore'

export const Sidebar = () => {
  const { sidebarOpen } = useUIStore()

  return (
    <aside
      className={`flex h-screen flex-col border-r border-slate-800 bg-brand-dark/90 transition-all ${
        sidebarOpen ? 'w-64' : 'w-16'
      }`}
    >
      <div className="flex items-center gap-2 px-4 py-4">
        <div className="h-8 w-8 rounded-lg bg-brand-action" />
        {sidebarOpen && <span className="text-sm font-semibold tracking-wide">LegalMind AI</span>}
      </div>
      <nav className="mt-4 flex-1 space-y-1 px-2 text-sm">
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
      `flex items-center rounded-md px-3 py-2 ${
        isActive ? 'bg-brand-action text-white' : 'text-brand-muted hover:bg-slate-800 hover:text-slate-100'
      }`
    }
  >
    <span>{label}</span>
  </NavLink>
)

