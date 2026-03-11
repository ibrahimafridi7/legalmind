import { useRef, useEffect } from 'react'
import type { ChatMessageWithCitations } from '../../hooks/useChat'
import { MessageBubble } from '../molecules/MessageBubble'
import { Button } from '../atoms/Button'
import { Spinner } from '../atoms/Spinner'

interface ChatWindowProps {
  messages: ChatMessageWithCitations[]
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isLoading: boolean
  isStreaming: boolean
}

export const ChatWindow = ({
  messages,
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  isStreaming
}: ChatWindowProps) => {
  const bottomSentinelRef = useRef<HTMLDivElement>(null)
  const prevMessageCountRef = useRef(0)
  const hasInitialScrollRef = useRef(false)

  // Scroll to bottom on first mount when there are messages (e.g. restored session)
  useEffect(() => {
    if (messages.length > 0 && !hasInitialScrollRef.current) {
      hasInitialScrollRef.current = true
      prevMessageCountRef.current = messages.length
      bottomSentinelRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' })
    }
  }, [messages.length])

  // Auto-scroll to bottom only when a new message is added (not on every streaming token)
  useEffect(() => {
    const count = messages.length
    if (count > prevMessageCountRef.current) {
      prevMessageCountRef.current = count
      bottomSentinelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages.length])

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div
        className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden border-b border-slate-800 scrollbar-thin"
        role="log"
        aria-label="Chat messages"
      >
        {messages.length === 0 ? (
          <div className="flex h-full min-h-[200px] items-center justify-center p-4 text-sm text-brand-muted">
            Ask a question about your matter, contract, or regulation.
          </div>
        ) : (
          <div className="flex flex-col gap-3 p-3 pb-4 sm:p-4">
            {messages.map((msg) => {
              const isLast = msg.id === messages[messages.length - 1]?.id
              const isStreamingEmpty =
                isStreaming &&
                isLast &&
                msg.role === 'assistant' &&
                (msg.content?.length ?? 0) === 0
              return (
                <div key={msg.id} style={{ minHeight: 0 }}>
                  <MessageBubble
                    message={msg}
                    isStreamingEmpty={isStreamingEmpty}
                    isStreaming={isLast && isStreaming}
                  />
                </div>
              )
            })}
            <div ref={bottomSentinelRef} className="h-0 shrink-0" aria-hidden />
          </div>
        )}
      </div>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {isStreaming ? 'AI is responding' : ''}
      </div>
      <form
        className="flex shrink-0 flex-wrap gap-2 p-3 sm:p-4"
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit(e)
        }}
      >
        <textarea
          className="chat-input min-h-[52px] max-h-[52px] flex-1 resize-none overflow-y-auto rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-action focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 sm:min-h-[56px] sm:max-h-[56px]"
          value={input}
          onChange={handleInputChange}
          placeholder="Ask a question about your matter, contract, or regulation…"
          rows={2}
          aria-label="Chat message"
        />
        <Button type="submit" disabled={isLoading} aria-label={isLoading ? 'Sending' : 'Send message'}>
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
