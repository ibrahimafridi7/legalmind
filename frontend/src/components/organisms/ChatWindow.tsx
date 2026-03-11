import { useRef, useCallback, useState, useEffect } from 'react'
import { VariableSizeList as List } from 'react-window'
import type { ListChildComponentProps } from 'react-window'
import type { ChatMessageWithCitations } from '../../hooks/useChat'
import { MessageBubble } from '../molecules/MessageBubble'
import { Button } from '../atoms/Button'
import { Spinner } from '../atoms/Spinner'

const ROW_MIN_HEIGHT = 56
const ROW_HEIGHT_ESTIMATE_PER_CHAR = 0.8
const LIST_OVERSCAN = 5

function useListHeight(containerRef: React.RefObject<HTMLDivElement | null>) {
  const [height, setHeight] = useState(400)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const update = () => setHeight(el.getBoundingClientRect().height)
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [containerRef])
  return height
}

interface ChatWindowProps {
  messages: ChatMessageWithCitations[]
  input: string
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  isLoading: boolean
  isStreaming: boolean
}

function estimateRowHeight(message: ChatMessageWithCitations): number {
  const contentLen = (message.content?.length ?? 0) + (message.citations?.length ?? 0) * 30
  return Math.max(ROW_MIN_HEIGHT, ROW_MIN_HEIGHT + contentLen * ROW_HEIGHT_ESTIMATE_PER_CHAR)
}

export const ChatWindow = ({
  messages,
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  isStreaming
}: ChatWindowProps) => {
  const listRef = useRef<List>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const listHeight = useListHeight(containerRef)

  useEffect(() => {
    if (messages.length > 0 && listRef.current) {
      listRef.current.resetAfterIndex(0)
      listRef.current.scrollToItem(messages.length - 1, 'end')
    }
  }, [messages.length, isStreaming])

  const getItemSize = useCallback(
    (index: number) => estimateRowHeight(messages[index]),
    [messages]
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, overflow: 'hidden' }}>
      <div
        ref={containerRef}
        className="flex-1 border-b border-slate-800"
        style={{ minHeight: 0, flex: '1 1 0', overflow: 'hidden' }}
      >
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center p-4 text-sm text-brand-muted">
            Ask a question about your matter, contract, or regulation.
          </div>
        ) : (
          <List
            ref={listRef}
            height={listHeight}
            width="100%"
            itemCount={messages.length}
            itemSize={getItemSize}
            overscanCount={LIST_OVERSCAN}
            style={{ overflowX: 'hidden' }}
            className="scrollbar-thin"
          >
            {({ index, style }: ListChildComponentProps) => (
              <div style={{ ...style, padding: '6px 12px' }}>
                <MessageBubble message={messages[index] as any} />
              </div>
            )}
          </List>
        )}
      </div>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="chat-typing-status"
      >
        {isStreaming ? 'AI is typing…' : '\u00A0'}
      </div>
      <form
        style={{ display: 'flex', gap: '8px', padding: '12px', flexShrink: 0 }}
        onSubmit={(e) => {
          e.preventDefault()
          handleSubmit(e)
        }}
      >
        <textarea
          className="chat-input focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-action focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
          style={{ flex: 1, minHeight: 56, maxHeight: 56, resize: 'none', overflowY: 'auto' }}
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

