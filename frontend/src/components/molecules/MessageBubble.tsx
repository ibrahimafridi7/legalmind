import type { ChatMessage } from '../../types/chat.types'

interface Props {
  message: ChatMessage
}

export const MessageBubble = ({ message }: Props) => {
  const isUser = message.role === 'user'
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-xl rounded-2xl px-4 py-2 text-sm leading-relaxed ${
          isUser ? 'bg-brand-action text-white' : 'bg-brand-surface text-slate-100'
        }`}
      >
        {message.content}
      </div>
    </div>
  )
}

