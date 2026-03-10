import { Sidebar } from '../components/organisms/Sidebar'
import { useAuditLogs } from '../queries/auditQueries'

export const AuditLogsPage = () => {
  const { data: logs, isLoading, isError } = useAuditLogs(100)

  return (
    <div className="layout-root">
      <Sidebar />
      <main className="page-main">
        <h1 className="page-title">Audit Logs</h1>
        {isError && <p className="text-sm text-red-400">Failed to load audit logs.</p>}
        {isLoading && <p className="text-muted text-sm">Loading…</p>}
        {logs && logs.length > 0 && (
          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-700">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-700 bg-slate-800/50">
                <tr>
                  <th className="px-4 py-2 font-medium text-slate-200">Time</th>
                  <th className="px-4 py-2 font-medium text-slate-200">Actor</th>
                  <th className="px-4 py-2 font-medium text-slate-200">Action</th>
                  <th className="px-4 py-2 font-medium text-slate-200">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-800">
                    <td className="px-4 py-2 text-slate-300">{new Date(log.at).toLocaleString()}</td>
                    <td className="px-4 py-2 text-slate-300">{log.actorEmail}</td>
                    <td className="px-4 py-2 text-slate-300">{log.action}</td>
                    <td className="px-4 py-2 text-slate-400">
                      {log.metadata ? JSON.stringify(log.metadata) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {logs && logs.length === 0 && !isLoading && (
          <p className="text-muted text-sm">No audit entries yet.</p>
        )}
      </main>
    </div>
  )
}

