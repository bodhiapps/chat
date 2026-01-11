import Header from './Header';
import { ChatContainer } from './chat/ChatContainer';
import { ConversationSidebar } from './chat/ConversationSidebar';
import { useSidebar } from '@/hooks/useSidebar';
import { useChatContext } from '@/context/ChatContext';

export default function Layout() {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { currentConversationId, loadConversation, startNewConversation } = useChatContext();

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
        />
        <ChatContainer />
      </div>
    </div>
  );
}
