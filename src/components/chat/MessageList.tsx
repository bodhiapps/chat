import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatContext } from '@/context/ChatContext';
import { useSettingsContext } from '@/hooks/useSettingsContext';
import type { ChatMessage } from '@/hooks/useChat';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  error?: string | null;
  currentConversationId?: string | null;
  onRetryMessage?: (index: number) => void;
}

export function MessageList({
  messages,
  isStreaming,
  error,
  currentConversationId,
  onRetryMessage,
}: MessageListProps) {
  const { highlightedMessageId } = useChatContext();
  const { settings } = useSettingsContext();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const isUserScrolledUpRef = useRef(false);
  const prevMessagesLengthRef = useRef(0);

  useEffect(() => {
    const viewport = scrollViewportRef.current;
    if (!viewport) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50;
      isUserScrolledUpRef.current = !isAtBottom;
    };

    viewport.addEventListener('scroll', handleScroll);
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    const isNewUserMessage =
      messages.length > prevMessagesLengthRef.current && lastMessage?.role === 'user';

    if (isNewUserMessage) {
      isUserScrolledUpRef.current = false;
    }

    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    if (!settings.display.disableAutoScroll && !isUserScrolledUpRef.current) {
      messagesEndRef.current?.scrollIntoView({
        behavior: isStreaming ? 'instant' : 'smooth',
      });
    }
  }, [messages, isStreaming, settings.display.disableAutoScroll]);

  useEffect(() => {
    if (highlightedMessageId) {
      const element = document.querySelector(`[data-message-id="${highlightedMessageId}"]`);
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightedMessageId]);

  return (
    <ScrollArea
      className="flex-1 overflow-hidden"
      data-testid="chat-area"
      data-teststate={error ? 'error' : isStreaming ? 'streaming' : 'idle'}
      data-test-chat-id={currentConversationId || ''}
      data-test-message-count={messages.length}
      ref={(node: HTMLDivElement | null) => {
        if (node) {
          const viewport = node.querySelector(
            '[data-slot="scroll-area-viewport"]'
          ) as HTMLDivElement;
          if (viewport) {
            scrollViewportRef.current = viewport;
          }
        }
      }}
    >
      <div className="p-4 bg-muted min-h-full">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <p className="text-center text-muted-foreground mt-8">
              No messages yet. Start a conversation!
            </p>
          ) : (
            <>
              {messages.map((msg, index) => (
                <MessageBubble
                  key={index}
                  message={msg}
                  index={index}
                  messageId={msg.id}
                  isHighlighted={msg.id === highlightedMessageId}
                  isStreaming={isStreaming}
                  isLastMessage={index === messages.length - 1}
                  onRetry={onRetryMessage ? () => onRetryMessage(index) : undefined}
                />
              ))}
              {isStreaming && (
                <div data-testid="streaming-indicator" className="flex justify-start mb-4">
                  <div className="bg-gray-200 px-4 py-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse" />
                      <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse delay-100" />
                      <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse delay-200" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
