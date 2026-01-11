import { useChatContext } from '@/context/ChatContext';
import { MessageList } from './MessageList';
import { InputArea } from './InputArea';

export function ChatContainer() {
  const {
    messages,
    isStreaming,
    error,
    isLoadingConversation,
    currentConversationId,
    retryMessage,
  } = useChatContext();

  return (
    <div
      className="flex flex-col flex-1"
      data-testid="chat-container"
      data-teststate={isLoadingConversation ? 'loading-conversation' : 'ready'}
    >
      <MessageList
        messages={messages}
        isStreaming={isStreaming}
        error={error}
        currentConversationId={currentConversationId}
        onRetryMessage={retryMessage}
      />
      <InputArea />
    </div>
  );
}
