import { useState } from 'react';
import { Copy, Check, Pencil, Trash2, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/hooks/useChat';

interface MessageActionsProps {
  message: ChatMessage;
  messageIndex: number;
  isVisible: boolean;
  isMobile: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  canEdit?: boolean;
  canDelete?: boolean;
}

export function MessageActions({
  message,
  messageIndex,
  isVisible,
  isMobile,
  onEdit,
  onDelete,
  canEdit = false,
  canDelete = false,
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleCopy = async () => {
    // Copy content + reasoning (if present)
    const textToCopy = message.extra?.reasoning_content
      ? `${message.extra.reasoning_content}\n\n${message.content}`
      : message.content;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy message:', err);
    }
  };

  const handleEdit = () => {
    setIsDropdownOpen(false);
    onEdit?.();
  };

  const handleDelete = () => {
    setIsDropdownOpen(false);
    onDelete?.();
  };

  // Desktop: show buttons on hover
  if (!isMobile) {
    return (
      <div
        data-testid="message-actions"
        className={cn(
          'flex items-center gap-1 transition-opacity duration-150',
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={handleCopy}
          title="Copy message"
          data-testid="btn-copy-message"
          data-message-index={messageIndex}
          data-copy-state={copied ? 'copied' : 'idle'}
          className="h-7 w-7"
        >
          {copied ? (
            <Check size={14} data-testid="copy-success-icon" className="text-primary" />
          ) : (
            <Copy size={14} />
          )}
        </Button>

        {canEdit && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleEdit}
            title="Edit message"
            data-testid="btn-edit-message"
            data-message-index={messageIndex}
            className="h-7 w-7"
          >
            <Pencil size={14} />
          </Button>
        )}

        {canDelete && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleDelete}
            title="Delete message"
            data-testid="btn-delete-message"
            data-message-index={messageIndex}
            className="h-7 w-7 text-destructive hover:text-destructive"
          >
            <Trash2 size={14} />
          </Button>
        )}
      </div>
    );
  }

  // Mobile: kebab menu dropdown
  return (
    <div data-testid="message-actions" className="relative">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        data-testid="message-kebab-menu"
        data-message-index={messageIndex}
        className="h-7 w-7"
      >
        <MoreVertical size={14} />
      </Button>

      {isDropdownOpen && (
        <>
          {/* Backdrop to close dropdown */}
          <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
          <div
            data-testid="message-actions-dropdown"
            className="absolute right-0 top-full mt-1 z-50 bg-popover border border-border rounded-md shadow-md py-1 min-w-[140px]"
          >
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent text-left"
              data-testid="btn-copy-message"
              data-message-index={messageIndex}
              data-copy-state={copied ? 'copied' : 'idle'}
            >
              {copied ? (
                <Check size={14} data-testid="copy-success-icon" className="text-primary" />
              ) : (
                <Copy size={14} />
              )}
              Copy
            </button>

            {canEdit && (
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent text-left"
                data-testid="btn-edit-message"
                data-message-index={messageIndex}
              >
                <Pencil size={14} />
                Edit
              </button>
            )}

            {canDelete && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-accent text-left text-destructive"
                data-testid="btn-delete-message"
                data-message-index={messageIndex}
              >
                <Trash2 size={14} />
                Delete
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
