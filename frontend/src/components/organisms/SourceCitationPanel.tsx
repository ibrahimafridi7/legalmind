import { useUIStore } from '../../store/uiStore'
import type { Citation } from '../../types/chat.types'
import { SourceCard } from '../molecules/SourceCard'

interface Props {
  citations: Citation[]
}

export const SourceCitationPanel = ({ citations }: Props) => {
  const { highlightedCitation, setHighlight } = useUIStore()

  return (
    <section className="h-full border-l border-slate-800 bg-brand-dark/80 p-3">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-brand-muted">Sources</h2>
      <div className="space-y-2 overflow-y-auto text-xs">
        {citations.map((c) => (
          <SourceCard
            key={c.id}
            citation={c}
            isActive={highlightedCitation === c.id}
            onClick={() => setHighlight(c.id)}
          />
        ))}
        {citations.length === 0 && (
          <p className="text-xs text-brand-muted">Citations from uploaded documents will appear here.</p>
        )}
      </div>
    </section>
  )
}

