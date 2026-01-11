import { ChatProvider, useChatContext } from '@/context/ChatContext';
import { MessageList } from './MessageList';
import { InputArea } from './InputArea';

function ChatContent() {
  const { messages, isStreaming, error } = useChatContext();

  return (
    <div className="flex flex-col flex-1">
      <MessageList messages={messages} isStreaming={isStreaming} error={error} />
      <InputArea />
    </div>
  );
}

export function ChatContainer() {
  return (
    <ChatProvider>
      <ChatContent />
    </ChatProvider>
  );
}
