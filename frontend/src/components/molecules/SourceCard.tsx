import type { Citation } from '../../types/chat.types'

interface Props {
  citation: Citation
  isActive?: boolean
  onClick?: () => void
}

export const SourceCard = ({ citation, isActive, onClick }: Props) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full rounded-lg border px-3 py-2 text-left text-xs ${
      isActive ? 'border-brand-action bg-slate-800' : 'border-slate-700 bg-brand-surface'
    }`}
  >
    <div className="mb-1 font-medium text-slate-100">
      {citation.docName ?? citation.documentId} · p.{citation.page}
    </div>
    <div className="line-clamp-3 text-brand-muted">{citation.snippet}</div>
  </button>
)

