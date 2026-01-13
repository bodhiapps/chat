import { useState, useRef, useEffect, useCallback } from 'react';
import { Textarea } from '@/components/ui/textarea';

interface EditableMessageProps {
  initialContent: string;
  onSave: (content: string) => void;
  onCancel: () => void;
  onDeleteRequest?: () => void;
}

export function EditableMessage({
  initialContent,
  onSave,
  onCancel,
  onDeleteRequest,
}: EditableMessageProps) {
  const [content, setContent] = useState(initialContent);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-focus on mount
  useEffect(() => {
    textareaRef.current?.focus();
    // Move cursor to end
    const length = textareaRef.current?.value.length || 0;
    textareaRef.current?.setSelectionRange(length, length);
  }, []);

  const handleSave = useCallback(() => {
    const trimmedContent = content.trim();
    if (trimmedContent === '') {
      // Empty content triggers delete confirmation
      onDeleteRequest?.();
    } else {
      onSave(trimmedContent);
    }
  }, [content, onSave, onDeleteRequest]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Escape: discard changes
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
        return;
      }

      // Enter (without Shift): submit/save
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSave();
        return;
      }

      // Shift+Enter: allow default behavior (insert new line)
    },
    [onCancel, handleSave]
  );

  const handleBlur = useCallback(
    (e: React.FocusEvent) => {
      // Check if focus is moving within the edit container
      const relatedTarget = e.relatedTarget as HTMLElement;
      const currentTarget = e.currentTarget as HTMLElement;
      const editContainer = currentTarget.closest('[data-edit-container]');

      const isWithinEditArea = editContainer && editContainer.contains(relatedTarget);

      if (!isWithinEditArea) {
        // Blur outside edit area discards changes
        onCancel();
      }
    },
    [onCancel]
  );

  return (
    <div data-edit-container>
      <Textarea
        ref={textareaRef}
        value={content}
        onChange={e => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        data-testid="edit-message-textarea"
        className="min-h-[60px] resize-none"
        placeholder="Enter message content... (Enter to save, Esc to cancel)"
      />
    </div>
  );
}
