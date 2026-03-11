import { FixedSizeList as List } from 'react-window'
import type { ListChildComponentProps } from 'react-window'
import { Sidebar } from '../components/organisms/Sidebar'
import { useAuditLogs } from '../queries/auditQueries'
import type { AuditLogDto } from '../queries/auditQueries'

const ROW_HEIGHT = 52
const TABLE_HEIGHT = 420
const GRID_COLS = 'minmax(140px, 1fr) minmax(120px, 1fr) minmax(120px, 1fr) minmax(160px, 2fr)'

function formatDetails(log: AuditLogDto): string {
  const parts: string[] = []
  if (log.metadata && Object.keys(log.metadata).length > 0) {
    parts.push(Object.entries(log.metadata).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`).join(' · '))
  }
  if (log.ip) parts.push(`IP: ${log.ip}`)
  return parts.length > 0 ? parts.join(' | ') : '—'
}

function AuditRow({ index, style, data }: ListChildComponentProps<AuditLogDto[]>) {
  const log = data[index]!
  const details = formatDetails(log)
  return (
    <div
      style={{ ...style, display: 'grid', gridTemplateColumns: GRID_COLS, alignItems: 'center', gap: 0, minWidth: 0 }}
      className="border-b border-slate-800 bg-brand-surface/50 text-sm"
    >
      <div className="truncate px-3 py-2 text-slate-300" title={new Date(log.at).toISOString()}>
        {new Date(log.at).toLocaleString()}
      </div>
      <div className="min-w-0 truncate px-3 py-2 text-slate-300" title={log.actorEmail}>
        {log.actorEmail}
      </div>
      <div className="min-w-0 truncate px-3 py-2 text-slate-300" title={log.action}>
        {log.action}
      </div>
      <div className="min-w-0 truncate px-3 py-2 text-slate-400" title={details}>
        {details}
      </div>
    </div>
  )
}

export const AuditLogsPage = () => {
  const { data: logs, isLoading, isError } = useAuditLogs(500)

  return (
    <div className="layout-root">
      <Sidebar />
      <main className="page-main min-w-0">
        <h1 className="page-title">Audit Logs</h1>
        <p className="text-sm text-brand-muted mt-1">
          Recent actions (document views, uploads, chat). Resets when the server restarts unless persisted.
        </p>
        {isError && <p className="mt-4 text-sm text-red-400">Failed to load audit logs.</p>}
        {isLoading && <p className="mt-4 text-brand-muted text-sm">Loading…</p>}
        {logs && logs.length > 0 && (
          <div className="mt-4 overflow-hidden rounded-lg border border-slate-700 w-full min-w-0">
            <div className="overflow-x-auto">
              <div
                className="grid border-b border-slate-700 bg-slate-800/50 px-3 py-2 text-left text-sm font-medium text-slate-200 shrink-0"
                style={{ gridTemplateColumns: GRID_COLS, minWidth: 520 }}
              >
                <div>Time</div>
                <div className="min-w-0 truncate">Actor</div>
                <div className="min-w-0 truncate">Action</div>
                <div className="min-w-0 truncate">Details</div>
              </div>
              <List
                height={Math.min(TABLE_HEIGHT, logs.length * ROW_HEIGHT)}
                width={800}
                itemCount={logs.length}
                itemSize={ROW_HEIGHT}
                itemData={logs}
                overscanCount={8}
              >
                {AuditRow}
              </List>
            </div>
          </div>
        )}
        {logs && logs.length === 0 && !isLoading && (
          <p className="mt-4 text-brand-muted text-sm">No audit entries yet. Use the app to generate logs.</p>
        )}
      </main>
    </div>
  )
}

