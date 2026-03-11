import type { ChatMessage, Citation } from '../../types/chat.types'
import { useUIStore } from '../../store/uiStore'
import api from '../../lib/api'
import { toast } from 'sonner'

interface Props {
  message: ChatMessage
  /** When true, show "AI is typing..." inside this assistant bubble (streaming, no content yet). */
  isStreamingEmpty?: boolean
}

export const MessageBubble = ({ message, isStreamingEmpty }: Props) => {
  const isUser = message.role === 'user'
  const { setHighlight, setActivePdfPage, setSelectedPdfUrl } = useUIStore()
  const citations = message.citations ?? []

  const onCitationClick = (c: Citation) => {
    setHighlight(c.id)
    setActivePdfPage(c.page)
    setSelectedPdfUrl(null)
    api
      .get<{ url: string }>(`/api/documents/${c.documentId}/pdf-url`)
      .then(({ data }) => setSelectedPdfUrl(data.url))
      .catch(() => {
        setSelectedPdfUrl(null)
        toast.error('PDF not available for this document. If it was uploaded earlier, try re-uploading it.')
      })
  }

  return (
    <div className={`message-row ${isUser ? 'message-row-user' : ''}`}>
      <div className={`message-bubble ${isUser ? 'message-bubble-user' : 'message-bubble-assistant'}`}>
        {isStreamingEmpty ? (
          <span className="text-brand-muted text-sm">AI is typing…</span>
        ) : (
          <div className={!isUser ? 'whitespace-pre-wrap break-words' : ''}>{message.content}</div>
        )}
        {!isUser && !isStreamingEmpty && citations.length > 0 && (
          <div className="mt-3 border-t border-slate-700/50 pt-2">
            <div className="mb-1.5 text-xs font-medium text-brand-muted">Sources</div>
            <div className="flex flex-wrap gap-1.5">
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
          </div>
        )}
      </div>
    </div>
  )
}

