import { useSessionStore } from '../../store/sessionStore'
import { useLegalChat } from '../../hooks/useChat'
import { MessageBubble } from '../molecules/MessageBubble'
import { Button } from '../atoms/Button'
import { Spinner } from '../atoms/Spinner'

export const ChatWindow = () => {
  const { activeSessionId } = useSessionStore()
  const sessionId = activeSessionId ?? 'demo'
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useLegalChat(sessionId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ flex: 1, overflowY: 'auto', borderBottom: '1px solid #1e293b', padding: '12px' }}>
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m as any} />
        ))}
      </div>
      <form
        style={{ display: 'flex', gap: '8px', padding: '12px' }}
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit(e as any)
        }}
      >
        <textarea
          style={{ flex: 1, minHeight: 48 }}
          value={input}
          onChange={handleInputChange}
          placeholder="Ask a question about your matter, contract, or regulation…"
          rows={2}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <span className="flex items-center gap-2">
              <Spinner /> Sending
            </span>
          ) : (
            'Send'
          )}
        </Button>
      </form>
    </div>
  )
}

