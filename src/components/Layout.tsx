import { useState, useCallback } from 'react';
import { useBodhi } from '@bodhiapp/bodhi-js-react';
import Header from './Header';
import { ChatContainer } from './chat/ChatContainer';
import { ConversationSidebar } from './chat/ConversationSidebar';
import { SearchModal } from './chat/SearchModal';
import { ShortcutGuideModal } from './chat/ShortcutGuideModal';
import { useSidebar } from '@/hooks/useSidebar';
import { useChatContext } from '@/context/ChatContext';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export default function Layout() {
  const { auth, isAuthenticated, login } = useBodhi();
  const userId = isAuthenticated ? (auth.user?.sub ?? null) : null;

  const { isCollapsed, toggleSidebar } = useSidebar();
  const { currentConversationId, loadConversation, startNewConversation, scrollToMessage } =
    useChatContext();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isShortcutGuideOpen, setIsShortcutGuideOpen] = useState(false);

  const handleOpenSearch = useCallback(() => {
    if (isAuthenticated) {
      setIsSearchOpen(true);
    }
  }, [isAuthenticated]);

  const handleCloseSearch = useCallback(() => {
    setIsSearchOpen(false);
  }, []);

  const handleShowShortcuts = useCallback(() => {
    setIsShortcutGuideOpen(true);
  }, []);

  const handleCloseShortcuts = useCallback(() => {
    setIsShortcutGuideOpen(false);
  }, []);

  const handleFocusInput = useCallback(() => {
    const input = document.querySelector('[data-testid="chat-input"]') as HTMLTextAreaElement;
    input?.focus();
  }, []);

  const handleEscape = useCallback(() => {
    // Close shortcut guide first if open, otherwise search
    if (isShortcutGuideOpen) {
      setIsShortcutGuideOpen(false);
    } else if (isSearchOpen) {
      setIsSearchOpen(false);
    }
  }, [isShortcutGuideOpen, isSearchOpen]);

  useKeyboardShortcuts({
    onOpenSearch: handleOpenSearch,
    onNewConversation: startNewConversation,
    onFocusInput: handleFocusInput,
    onShowShortcuts: handleShowShortcuts,
    onEscape: handleEscape,
  });

  const handleSearchResultClick = async (conversationId: string, messageId: string) => {
    await loadConversation(conversationId);
    setTimeout(() => scrollToMessage?.(messageId), 100);
  };

  return (
    <div className="fixed inset-0 flex flex-col">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <ConversationSidebar
          isCollapsed={isCollapsed}
          onToggle={toggleSidebar}
          currentConversationId={currentConversationId}
          onConversationSelect={loadConversation}
          onNewConversation={startNewConversation}
          onSearchClick={() => setIsSearchOpen(true)}
          userId={userId}
          isAuthenticated={isAuthenticated}
          onLogin={login}
        />
        <ChatContainer />
      </div>
      <SearchModal
        isOpen={isSearchOpen}
        onClose={handleCloseSearch}
        onResultClick={handleSearchResultClick}
        userId={userId}
      />
      <ShortcutGuideModal isOpen={isShortcutGuideOpen} onClose={handleCloseShortcuts} />
    </div>
  );
}
