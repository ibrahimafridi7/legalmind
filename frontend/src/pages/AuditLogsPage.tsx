import { useState } from 'react'
import { FixedSizeList as List } from 'react-window'
import type { ListChildComponentProps } from 'react-window'
import { Sidebar } from '../components/organisms/Sidebar'
import { useAuditLogs, AUDIT_ACTIONS } from '../queries/auditQueries'
import type { AuditLogDto } from '../queries/auditQueries'
import { Button } from '../components/atoms/Button'

const ROW_HEIGHT = 52
const TABLE_HEIGHT = 420
const GRID_COLS = 'minmax(140px, 1fr) minmax(120px, 1fr) minmax(120px, 1fr) minmax(160px, 2fr)'

function formatDetails(log: AuditLogDto): string {
  const parts: string[] = []
  if (log.metadata && Object.keys(log.metadata).length > 0) {
    parts.push(
      Object.entries(log.metadata)
        .map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
        .join(' · ')
    )
  }
  if (log.ip) parts.push(`IP: ${log.ip}`)
  return parts.length > 0 ? parts.join(' | ') : '—'
}

function AuditRow({ index, style, data }: ListChildComponentProps<AuditLogDto[]>) {
  const log = data[index]!
  const details = formatDetails(log)
  return (
    <div
      style={{
        ...style,
        display: 'grid',
        gridTemplateColumns: GRID_COLS,
        alignItems: 'center',
        gap: 0,
        minWidth: 0
      }}
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
  const [actionFilter, setActionFilter] = useState<string>('')
  const [actorEmailFilter, setActorEmailFilter] = useState('')

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useAuditLogs({
    limit: 100,
    action: actionFilter || undefined,
    actorEmail: actorEmailFilter.trim() || undefined
  })

  const logs = data?.pages.flatMap((p) => p.logs) ?? []

  return (
    <div className="layout-root">
      <Sidebar />
      <main className="page-main min-w-0">
        <h1 className="page-title">Audit Logs</h1>
        <p className="mt-1 text-sm text-brand-muted">
          Traceable actions: LOGIN, UPLOAD_DOCUMENT, VIEW_DOCUMENT, DELETE_DOCUMENT, CHAT_QUERY. Resets when the server
          restarts unless persisted.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <span>Action</span>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-action"
            >
              <option value="">All</option>
              {AUDIT_ACTIONS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <span>Actor (email)</span>
            <input
              type="text"
              value={actorEmailFilter}
              onChange={(e) => setActorEmailFilter(e.target.value)}
              placeholder="user@email.com"
              className="min-w-[180px] rounded border border-slate-700 bg-slate-800 px-2 py-1.5 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-action"
            />
          </label>
        </div>

        {isError && <p className="mt-4 text-sm text-red-400">Failed to load audit logs.</p>}
        {isLoading && <p className="mt-4 text-sm text-brand-muted">Loading…</p>}
        {logs.length > 0 && (
          <div className="mt-4 w-full min-w-0 overflow-hidden rounded-lg border border-slate-700">
            <div className="overflow-x-auto">
              <div
                className="grid shrink-0 border-b border-slate-700 bg-slate-800/50 px-3 py-2 text-left text-sm font-medium text-slate-200"
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
            {hasNextPage && (
              <div className="border-t border-slate-700 bg-slate-800/30 px-3 py-2">
                <Button
                  type="button"
                  onClick={() => fetchNextPage()}
                  disabled={isFetchingNextPage}
                >
                  {isFetchingNextPage ? 'Loading…' : 'Load more'}
                </Button>
              </div>
            )}
          </div>
        )}
        {logs.length === 0 && !isLoading && (
          <p className="mt-4 text-sm text-brand-muted">No audit entries yet. Use the app to generate logs.</p>
        )}
      </main>
    </div>
  )
}
