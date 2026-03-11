import { useEffect, useRef } from 'react'
import { useSessionStore } from '../store/sessionStore'
import { useLegalChat } from '../hooks/useChat'
import { useUIStore } from '../store/uiStore'
import { Sidebar } from '../components/organisms/Sidebar'
import { ChatWindow } from '../components/organisms/ChatWindow'
import { SourceCitationPanel } from '../components/organisms/SourceCitationPanel'
import { PDFViewerPanel } from '../components/organisms/PDFViewerPanel'
import type { Citation, ChatMessageWithCitations } from '../types/chat.types'

/** Citations only from the latest assistant message (current response). */
function getCitationsForLatestResponse(messages: ChatMessageWithCitations[]): Citation[] {
  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant')
  return lastAssistant?.citations ?? []
}

export const ChatPage = () => {
  const { activeSessionId } = useSessionStore()
  const sessionId = activeSessionId ?? 'demo'
  const chat = useLegalChat(sessionId)
  const { setSelectedPdfUrl } = useUIStore()
  const citations = getCitationsForLatestResponse(chat.messages)
  const lastClearedForMessageId = useRef<string | null>(null)

  // When a new response starts streaming (assistant message with empty content), clear PDF so we don't show the previous response's doc.
  useEffect(() => {
    const messages = chat.messages
    if (messages.length === 0) return
    const last = messages[messages.length - 1]
    if (last.role === 'assistant' && last.content === '' && last.id !== lastClearedForMessageId.current) {
      lastClearedForMessageId.current = last.id
      setSelectedPdfUrl(null)
    }
    if (last.role === 'assistant' && last.content !== '') lastClearedForMessageId.current = null
  }, [chat.messages, setSelectedPdfUrl])

  return (
    <div className="chat-page">
      <Sidebar />
      <main className="chat-main">
        {/* Left: Chat */}
        <section
          className="chat-split-left"
          style={{ flex: 1, minWidth: 0, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
          <ChatWindow
            messages={chat.messages}
            input={chat.input}
            handleInputChange={chat.handleInputChange}
            handleSubmit={chat.handleSubmit}
            isLoading={chat.isLoading}
            isStreaming={chat.isStreaming}
          />
        </section>
        {/* Right: Sources + PDF (split-screen panel) */}
        <section className="chat-split-right">
          <div className="chat-split-right-inner">
            <SourceCitationPanel citations={citations} />
            <div className="chat-pdf-area">
              <PDFViewerPanel />
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

