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
        <section style={{ flex: 1, minWidth: 0 }}>
          <ChatWindow
            messages={chat.messages}
            input={chat.input}
            handleInputChange={chat.handleInputChange}
            handleSubmit={chat.handleSubmit}
            isLoading={chat.isLoading}
            isStreaming={chat.isStreaming}
          />
        </section>
        <section
          className="flex w-[400px] shrink-0 flex-col gap-3 border-l border-slate-800 p-3"
          style={{ maxHeight: '100%' }}
        >
          <div className="min-h-0 flex-1 overflow-hidden">
            <SourceCitationPanel citations={citations} />
          </div>
          <div className="h-[320px] min-h-0 shrink-0 overflow-hidden">
            <PDFViewerPanel />
          </div>
        </section>
      </main>
    </div>
  )
}

