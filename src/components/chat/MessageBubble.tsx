import type { ChatMessage } from '@/hooks/useChat';

interface MessageBubbleProps {
  message: ChatMessage;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        data-testid={isUser ? 'message-user' : 'message-assistant'}
        className={`max-w-[70%] px-4 py-2 rounded-lg ${isUser ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900 border border-gray-200'}`}
      >
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
      </div>
    </div>
  );
}
