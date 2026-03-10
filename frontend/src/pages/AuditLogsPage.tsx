import { Sidebar } from '../components/organisms/Sidebar'

export const AuditLogsPage = () => {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex flex-1 flex-col bg-brand-dark px-6 py-4">
        <h1 className="mb-2 text-lg font-semibold text-slate-100">Audit Logs</h1>
        <p className="text-sm text-brand-muted">
          This page will be restricted to admins. Use TanStack Query to load audit events from the backend and present
          a paginated table here.
        </p>
      </main>
    </div>
  )
}

