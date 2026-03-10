import { useMemo } from 'react'
import { FixedSizeList as List } from 'react-window'
import { useSessionStore } from '../../store/sessionStore'
import { useLegalChat } from '../../hooks/useChat'
import { MessageBubble } from '../molecules/MessageBubble'
import { Button } from '../atoms/Button'
import { Spinner } from '../atoms/Spinner'

export const ChatWindow = () => {
  const { activeSessionId } = useSessionStore()
  const sessionId = activeSessionId ?? 'demo'
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useLegalChat(sessionId)

  const itemData = useMemo(() => messages, [messages])

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 border-b border-slate-800">
        <List
          height={window.innerHeight - 200}
          itemCount={itemData.length}
          itemSize={72}
          width="100%"
          itemData={itemData}
        >
          {({ index, style }) => (
            <div style={style}>
              <MessageBubble message={itemData[index] as any} />
            </div>
          )}
        </List>
      </div>
      <form
        className="flex items-end gap-2 bg-brand-dark px-4 py-3"
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit(e as any)
        }}
      >
        <textarea
          className="min-h-[48px] flex-1 resize-none rounded-lg border border-slate-700 bg-brand-surface px-3 py-2 text-sm text-slate-100 placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-action"
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

