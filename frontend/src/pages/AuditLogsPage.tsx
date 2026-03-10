import { Sidebar } from '../components/organisms/Sidebar'

export const AuditLogsPage = () => {
  return (
    <div className="layout-root">
      <Sidebar />
      <main className="page-main">
        <h1 className="page-title">Audit Logs</h1>
        <p className="text-muted" style={{ fontSize: 14 }}>
          This page will be restricted to admins. Use TanStack Query to load audit events from the backend and present
          a paginated table here.
        </p>
      </main>
    </div>
  )
}

