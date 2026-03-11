import { useSessionStore } from '../store/sessionStore'
import { useLegalChat } from '../hooks/useChat'
import { Sidebar } from '../components/organisms/Sidebar'
import { ChatWindow } from '../components/organisms/ChatWindow'
import { SourceCitationPanel } from '../components/organisms/SourceCitationPanel'
import { PDFViewerPanel } from '../components/organisms/PDFViewerPanel'
import type { Citation } from '../types/chat.types'

function collectCitations(messages: { citations?: Citation[] }[]): Citation[] {
  return messages.flatMap((m) => m.citations ?? [])
}

export const ChatPage = () => {
  const { activeSessionId } = useSessionStore()
  const sessionId = activeSessionId ?? 'demo'
  const chat = useLegalChat(sessionId)
  const citations = collectCitations(chat.messages)

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

