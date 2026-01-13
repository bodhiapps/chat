import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSettingsContext } from '@/hooks/useSettingsContext';
import { MarkdownContent } from '@/components/markdown/MarkdownContent';
import { ThinkingBlock } from '@/components/markdown/ThinkingBlock';
import type { ChatMessage } from '@/hooks/useChat';

interface MessageBubbleProps {
  message: ChatMessage;
  index: number;
  messageId?: string;
  isHighlighted?: boolean;
  isStreaming?: boolean;
  isLastMessage?: boolean;
  onRetry?: () => void;
}

export function MessageBubble({
  message,
  index,
  messageId,
  isHighlighted,
  isStreaming = false,
  isLastMessage = false,
  onRetry,
}: MessageBubbleProps) {
  const { settings } = useSettingsContext();
  const isUser = message.role === 'user';
  const renderAsMarkdown =
    message.role === 'assistant' || settings.display.renderUserContentAsMarkdown;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        data-testid={isUser ? 'message-user' : 'message-assistant'}
        data-test-index={index}
        data-teststate={message.error ? 'error' : 'success'}
        data-message-id={messageId}
        className={cn(
          'max-w-[70%] px-4 py-2 rounded-lg transition-all duration-500',
          isHighlighted && 'ring-2 ring-yellow-400 bg-yellow-50',
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-foreground border border-border'
        )}
      >
        {message.extra?.reasoning_content && (
          <ThinkingBlock
            content={message.extra.reasoning_content}
            isStreaming={isStreaming && isLastMessage}
            autoExpand={settings.display.showThoughtInProgress}
          />
        )}

        {renderAsMarkdown ? (
          <MarkdownContent content={message.content} />
        ) : (
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
        )}

        {message.error && (
          <div className="flex items-center gap-2 mt-2 text-red-600 text-sm">
            <AlertCircle size={14} />
            <span>{message.error.message}</span>
            {message.error.retryable && onRetry && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRetry}
                data-testid="btn-retry-message"
                className="text-red-600 hover:text-red-700"
              >
                <RefreshCw size={14} className="mr-1" />
                Retry
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
