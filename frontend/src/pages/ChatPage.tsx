import { Sidebar } from '../components/organisms/Sidebar'
import { ChatWindow } from '../components/organisms/ChatWindow'
import { SourceCitationPanel } from '../components/organisms/SourceCitationPanel'

export const ChatPage = () => {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex flex-1 flex-row">
        <section className="flex-1">
          <ChatWindow />
        </section>
        <section className="w-80 border-l border-slate-800">
          <SourceCitationPanel citations={[]} />
        </section>
      </main>
    </div>
  )
}

