import { Sidebar } from '../components/organisms/Sidebar'
import { ChatWindow } from '../components/organisms/ChatWindow'
import { SourceCitationPanel } from '../components/organisms/SourceCitationPanel'

export const ChatPage = () => {
  return (
    <div className="chat-page">
      <Sidebar />
      <main className="chat-main">
        <section style={{ flex: 1 }}>
          <ChatWindow />
        </section>
        <section style={{ width: 320, borderLeft: '1px solid #1e293b', padding: 12 }}>
          <SourceCitationPanel citations={[]} />
        </section>
      </main>
    </div>
  )
}

