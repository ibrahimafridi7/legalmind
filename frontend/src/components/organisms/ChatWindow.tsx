import { useRef, useCallback, useState, useEffect } from 'react'
import { VariableSizeList as List } from 'react-window'
import type { ListChildComponentProps } from 'react-window'
import type { ChatMessageWithCitations } from '../../hooks/useChat'
import { MessageBubble } from '../molecules/MessageBubble'
import { Button } from '../atoms/Button'
import { Spinner } from '../atoms/Spinner'

const ROW_MIN_HEIGHT = 56
const ROW_GAP = 12
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
  return ROW_GAP + Math.max(ROW_MIN_HEIGHT, ROW_MIN_HEIGHT + contentLen * ROW_HEIGHT_ESTIMATE_PER_CHAR)
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

  const lastMessageContentLength = messages.length > 0 ? (messages[messages.length - 1]?.content?.length ?? 0) : 0
  useEffect(() => {
    if (messages.length > 0 && listRef.current) {
      listRef.current.resetAfterIndex(0)
      listRef.current.scrollToItem(messages.length - 1, 'end')
    }
  }, [messages.length, isStreaming, lastMessageContentLength])

  const getItemSize = useCallback(
    (index: number) => estimateRowHeight(messages[index]),
    [messages]
  )

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div
        ref={containerRef}
        className="min-h-0 flex-1 border-b border-slate-800 overflow-hidden"
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
            {({ index, style }: ListChildComponentProps) => {
              const isLast = index === messages.length - 1
              const lastMsg = messages[index]
              const isStreamingEmpty =
                isStreaming &&
                isLast &&
                lastMsg?.role === 'assistant' &&
                (lastMsg?.content?.length ?? 0) === 0
              return (
                <div style={{ ...style, padding: '8px 12px 12px', minHeight: style.height as number }}>
                  <MessageBubble message={lastMsg as any} isStreamingEmpty={isStreamingEmpty} />
                </div>
              )
            }}
          </List>
        )}
      </div>
      <div role="status" aria-live="polite" aria-atomic="true" className="min-h-[0.5rem]" />
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

