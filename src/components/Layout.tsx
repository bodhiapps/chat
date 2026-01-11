import { useState } from 'react';
import { useBodhi } from '@bodhiapp/bodhi-js-react';
import Header from './Header';
import { ChatContainer } from './chat/ChatContainer';
import { ConversationSidebar } from './chat/ConversationSidebar';
import { SearchModal } from './chat/SearchModal';
import { useSidebar } from '@/hooks/useSidebar';
import { useChatContext } from '@/context/ChatContext';

export default function Layout() {
  const { auth, isAuthenticated, login } = useBodhi();
  const userId = isAuthenticated ? (auth.user?.sub ?? null) : null;

  const { isCollapsed, toggleSidebar } = useSidebar();
  const { currentConversationId, loadConversation, startNewConversation, scrollToMessage } =
    useChatContext();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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
        onClose={() => setIsSearchOpen(false)}
        onResultClick={handleSearchResultClick}
        userId={userId}
      />
    </div>
  );
}
