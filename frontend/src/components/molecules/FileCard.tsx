import type { DocumentSummary } from '../../types/document.types'
import { Badge } from '../atoms/Badge'

interface Props {
  doc: DocumentSummary
}

export const FileCard = ({ doc }: Props) => (
  <div className="flex items-center justify-between rounded-lg bg-brand-surface px-4 py-3">
    <div>
      <p className="text-sm font-medium text-slate-100">{doc.name}</p>
      <p className="text-xs text-brand-muted">Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}</p>
    </div>
    <Badge tone={doc.status === 'ready' ? 'success' : doc.status === 'failed' ? 'danger' : 'warning'}>
      {doc.status.toUpperCase()}
    </Badge>
  </div>
)

