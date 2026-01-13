import { useEffect, useCallback } from 'react';

interface UseKeyboardShortcutsOptions {
  onOpenSearch: () => void;
  onNewConversation: () => void;
  onFocusInput?: () => void;
  onEscape?: () => void;
  onShowShortcuts?: () => void;
}

/**
 * Global keyboard shortcuts hook.
 * - Ctrl/Cmd+K: Open search modal
 * - Ctrl/Cmd+Shift+O: Create new conversation
 * - /: Focus chat input (when not in an input field)
 * - ?: Show keyboard shortcuts guide
 * - Escape: Close modals/exit edit mode
 */
export function useKeyboardShortcuts({
  onOpenSearch,
  onNewConversation,
  onFocusInput,
  onEscape,
  onShowShortcuts,
}: UseKeyboardShortcutsOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      const target = event.target as HTMLElement;
      const isInInput =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Ctrl/Cmd+K: Open search
      if (mod && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        onOpenSearch();
        return;
      }

      // Ctrl/Cmd+Shift+O: New conversation
      if (mod && event.shiftKey && event.key.toLowerCase() === 'o') {
        event.preventDefault();
        onNewConversation();
        return;
      }

      // /: Focus chat input (only when not in an input field)
      if (event.key === '/' && !isInInput && onFocusInput) {
        event.preventDefault();
        onFocusInput();
        return;
      }

      // ?: Show keyboard shortcuts guide (only when not in an input field)
      if (event.key === '?' && !isInInput && onShowShortcuts) {
        event.preventDefault();
        onShowShortcuts();
        return;
      }

      // Escape: Close modals/exit edit mode
      if (event.key === 'Escape' && onEscape) {
        onEscape();
        return;
      }
    },
    [onOpenSearch, onNewConversation, onFocusInput, onShowShortcuts, onEscape]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
