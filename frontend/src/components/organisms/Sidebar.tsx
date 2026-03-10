import { NavLink } from 'react-router-dom'
import { useUIStore } from '../../store/uiStore'

export const Sidebar = () => {
  const { sidebarOpen } = useUIStore()

  return (
    <aside className="sidebar" style={{ width: sidebarOpen ? 240 : 64 }}>
      <div className="sidebar-header">
        <div className="sidebar-logo" />
        {sidebarOpen && <span className="text-sm font-semibold tracking-wide">LegalMind AI</span>}
      </div>
      <nav className="sidebar-nav">
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
      isActive ? 'sidebar-link sidebar-link-active' : 'sidebar-link'
    }
  >
    <span>{label}</span>
  </NavLink>
)

