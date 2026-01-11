import { ChatProvider, useChatContext } from '@/context/ChatContext';
import { MessageList } from './MessageList';
import { InputArea } from './InputArea';

function ChatContent() {
  const { messages, isStreaming, error } = useChatContext();

  return (
    <>
      <MessageList messages={messages} isStreaming={isStreaming} error={error} />
      <InputArea />
    </>
  );
}

export function ChatContainer() {
  return (
    <ChatProvider>
      <ChatContent />
    </ChatProvider>
  );
}
