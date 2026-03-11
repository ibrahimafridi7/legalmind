import type { ChatMessage } from '../../types/chat.types'
import { useUIStore } from '../../store/uiStore'
import { SAMPLE_PDF_URL } from '../../lib/config'

interface Props {
  message: ChatMessage
}

export const MessageBubble = ({ message }: Props) => {
  const isUser = message.role === 'user'
  const { setHighlight, setActivePdfPage, setSelectedPdfUrl } = useUIStore()
  const citations = message.citations ?? []

  const onCitationClick = (c: { id: string; page: number }) => {
    setHighlight(c.id)
    setActivePdfPage(c.page)
    setSelectedPdfUrl(SAMPLE_PDF_URL)
  }

  return (
    <div className={`message-row ${isUser ? 'message-row-user' : ''}`}>
      <div className={`message-bubble ${isUser ? 'message-bubble-user' : 'message-bubble-assistant'}`}>
        {message.content}
        {!isUser && citations.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5 border-t border-slate-700/50 pt-2">
            {citations.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onCitationClick(c)}
                className="rounded bg-slate-700/80 px-2 py-1 text-xs text-brand-muted hover:bg-slate-600 hover:text-slate-200"
              >
                {c.docName ?? c.documentId} · p.{c.page}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

