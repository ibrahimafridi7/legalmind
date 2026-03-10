import type { ChatMessage } from '../../types/chat.types'

interface Props {
  message: ChatMessage
}

export const MessageBubble = ({ message }: Props) => {
  const isUser = message.role === 'user'
  return (
    <div className={`message-row ${isUser ? 'message-row-user' : ''}`}>
      <div className={`message-bubble ${isUser ? 'message-bubble-user' : 'message-bubble-assistant'}`}>{message.content}</div>
    </div>
  )
}

