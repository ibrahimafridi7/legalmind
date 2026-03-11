import { FixedSizeList as List } from 'react-window'
import type { ListChildComponentProps } from 'react-window'
import { Sidebar } from '../components/organisms/Sidebar'
import { useAuditLogs } from '../queries/auditQueries'
import type { AuditLogDto } from '../queries/auditQueries'

const ROW_HEIGHT = 52
const TABLE_HEIGHT = 420

function AuditRow({ index, style, data }: ListChildComponentProps<AuditLogDto[]>) {
  const log = data[index]!
  return (
    <div
      style={style}
      className="flex items-center border-b border-slate-800 bg-brand-surface/50 text-sm"
    >
      <div className="w-[160px] shrink-0 px-4 py-2 text-slate-300">
        {new Date(log.at).toLocaleString()}
      </div>
      <div className="min-w-0 flex-1 truncate px-4 py-2 text-slate-300" title={log.actorEmail}>
        {log.actorEmail}
      </div>
      <div className="w-[140px] shrink-0 truncate px-4 py-2 text-slate-300" title={log.action}>
        {log.action}
      </div>
      <div className="min-w-0 max-w-[240px] truncate px-4 py-2 text-slate-400" title={log.metadata ? JSON.stringify(log.metadata) : undefined}>
        {log.metadata ? JSON.stringify(log.metadata) : '—'}
      </div>
    </div>
  )
}

export const AuditLogsPage = () => {
  const { data: logs, isLoading, isError } = useAuditLogs(500)

  return (
    <div className="layout-root">
      <Sidebar />
      <main className="page-main">
        <h1 className="page-title">Audit Logs</h1>
        {isError && <p className="text-sm text-red-400">Failed to load audit logs.</p>}
        {isLoading && <p className="text-muted text-sm">Loading…</p>}
        {logs && logs.length > 0 && (
          <div className="mt-4 overflow-hidden rounded-lg border border-slate-700">
            <div className="flex border-b border-slate-700 bg-slate-800/50 text-left text-sm font-medium text-slate-200">
              <div className="w-[160px] shrink-0 px-4 py-2">Time</div>
              <div className="min-w-0 flex-1 px-4 py-2">Actor</div>
              <div className="w-[140px] shrink-0 px-4 py-2">Action</div>
              <div className="min-w-0 max-w-[240px] px-4 py-2">Details</div>
            </div>
            <List
              height={Math.min(TABLE_HEIGHT, logs.length * ROW_HEIGHT)}
              width="100%"
              itemCount={logs.length}
              itemSize={ROW_HEIGHT}
              itemData={logs}
              overscanCount={8}
            >
              {AuditRow}
            </List>
          </div>
        )}
        {logs && logs.length === 0 && !isLoading && (
          <p className="text-muted text-sm">No audit entries yet.</p>
        )}
      </main>
    </div>
  )
}

