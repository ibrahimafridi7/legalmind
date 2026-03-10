import type { DocumentSummary } from '../../types/document.types'
import { Badge } from '../atoms/Badge'

interface Props {
  doc: DocumentSummary
}

export const FileCard = ({ doc }: Props) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 10, background: '#020617', padding: '10px 14px', border: '1px solid #1e293b' }}>
    <div>
      <p style={{ fontSize: 14, fontWeight: 500 }}>{doc.name}</p>
      <p style={{ fontSize: 12, color: '#94a3b8' }}>Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}</p>
    </div>
    <Badge tone={doc.status === 'ready' ? 'success' : doc.status === 'failed' ? 'danger' : 'warning'}>
      {doc.status.toUpperCase()}
    </Badge>
  </div>
)

