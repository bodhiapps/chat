import { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSettingsContext } from '@/hooks/useSettingsContext';
import { MarkdownContent } from '@/components/markdown/MarkdownContent';
import { ThinkingBlock } from '@/components/markdown/ThinkingBlock';
import { MessageActions } from './MessageActions';
import { EditableMessage } from './EditableMessage';
import { DeleteMessageDialog } from './DeleteMessageDialog';
import type { ChatMessage } from '@/hooks/useChat';

interface MessageBubbleProps {
  message: ChatMessage;
  index: number;
  messageId?: string;
  isHighlighted?: boolean;
  isStreaming?: boolean;
  isLastMessage?: boolean;
  onRetry?: () => void;
  onEdit?: (newContent: string) => void;
  onDelete?: () => void;
  onGetCascadeCount?: () => Promise<number>;
}

export function MessageBubble({
  message,
  index,
  messageId,
  isHighlighted,
  isStreaming = false,
  isLastMessage = false,
  onRetry,
  onEdit,
  onDelete,
  onGetCascadeCount,
}: MessageBubbleProps) {
  const { settings } = useSettingsContext();
  const isUser = message.role === 'user';
  const renderAsMarkdown =
    message.role === 'assistant' || settings.display.renderUserContentAsMarkdown;

  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [cascadeCount, setCascadeCount] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(max-width: 768px)').matches);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleStartEdit = () => {
    setIsEditing(true);
  };

  const handleSaveEdit = (newContent: string) => {
    onEdit?.(newContent);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleDeleteRequest = async () => {
    // Get cascade count before showing dialog
    if (onGetCascadeCount) {
      const count = await onGetCascadeCount();
      setCascadeCount(count);
    }
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    onDelete?.();
    setShowDeleteDialog(false);
  };

  // Don't show actions while streaming
  const showActions = !isStreaming && (isHovered || isMobile);

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4 group`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`flex items-start gap-2 max-w-[70%] ${isUser ? 'flex-row-reverse' : ''}`}>
        <div
          data-testid={isUser ? 'message-user' : 'message-assistant'}
          data-test-index={index}
          data-teststate={message.error ? 'error' : isEditing ? 'editing' : 'success'}
          data-message-id={messageId}
          className={cn(
            'px-4 py-2 rounded-lg transition-all duration-500',
            isHighlighted && 'ring-2 ring-ring bg-accent',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'bg-card text-foreground border border-border/30'
          )}
        >
          {isEditing ? (
            <EditableMessage
              initialContent={message.content}
              onSave={handleSaveEdit}
              onCancel={handleCancelEdit}
              onDeleteRequest={handleDeleteRequest}
            />
          ) : (
            <>
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
                <div className="flex items-center gap-2 mt-2 text-destructive text-sm">
                  <AlertCircle size={14} />
                  <span>{message.error.message}</span>
                  {message.error.retryable && onRetry && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onRetry}
                      data-testid="btn-retry-message"
                      className="text-destructive hover:text-destructive/80"
                    >
                      <RefreshCw size={14} className="mr-1" />
                      Retry
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {!isEditing && (
          <MessageActions
            message={message}
            messageIndex={index}
            isVisible={showActions}
            isMobile={isMobile}
            onEdit={isUser ? handleStartEdit : undefined}
            onDelete={isUser ? handleDeleteRequest : undefined}
            canEdit={isUser}
            canDelete={isUser}
          />
        )}
      </div>

      <DeleteMessageDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleConfirmDelete}
        cascadeCount={cascadeCount}
      />
    </div>
  );
}
