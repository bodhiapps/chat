import { useEffect, useState, useCallback } from 'react';
import { PanelLeftClose, PanelLeft, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { usePersistence } from '@/hooks/usePersistence';
import { ConversationItem } from './ConversationItem';
import type { Conversation } from '@/db/schema';

interface ConversationSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  currentConversationId: string | null;
  onConversationSelect: (id: string) => void;
  onNewConversation: () => void;
  onSearchClick: () => void;
  userId: string | null;
  isAuthenticated: boolean;
  onLogin: () => void;
}

export function ConversationSidebar({
  isCollapsed,
  onToggle,
  currentConversationId,
  onConversationSelect,
  onNewConversation,
  onSearchClick,
  userId,
  isAuthenticated,
  onLogin,
}: ConversationSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { listConversations, deleteConversation, togglePin } = usePersistence(userId);

  const loadConversations = useCallback(async () => {
    setIsLoading(true);
    const convs = await listConversations();
    setConversations(convs);
    setIsLoading(false);
  }, [listConversations]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadConversations();
  }, [loadConversations, currentConversationId]);

  const handleDelete = async (id: string) => {
    await deleteConversation(id);
    if (currentConversationId === id) {
      onNewConversation();
    }
    await loadConversations();
  };

  const handlePin = async (id: string) => {
    await togglePin(id);
    await loadConversations();
  };

  const pinnedConversations = conversations.filter(c => c.pinned);
  const unpinnedConversations = conversations.filter(c => !c.pinned);

  if (isCollapsed) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggle}
        className="fixed left-2 top-20 z-10"
        title="Show sidebar"
        data-testid="btn-show-sidebar"
      >
        <PanelLeft size={20} />
      </Button>
    );
  }

  return (
    <div
      className="w-64 border-r bg-white flex flex-col"
      data-testid="conversation-sidebar"
      data-teststate={isLoading ? 'loading' : 'ready'}
      data-test-conversation-count={conversations.length}
    >
      <div className="p-3 border-b space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">Conversations</h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onSearchClick}
              title="Search conversations"
              disabled={!isAuthenticated}
              data-testid="btn-search-conversations"
            >
              <Search size={18} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              title="Hide sidebar"
              data-testid="btn-hide-sidebar"
            >
              <PanelLeftClose size={18} />
            </Button>
          </div>
        </div>

        <Button
          onClick={onNewConversation}
          className="w-full justify-start gap-2"
          variant="outline"
          size="sm"
          disabled={!isAuthenticated}
          data-testid="btn-new-conversation"
        >
          <Plus size={16} />
          New chat
        </Button>
      </div>

      <ScrollArea className="flex-1" data-test-pinned-count={pinnedConversations.length}>
        <div className="p-2 space-y-1">
          {!isAuthenticated ? (
            <div className="text-center py-8 px-4" data-testid="sidebar-login-prompt">
              <p className="text-sm text-gray-500 mb-4">
                Log in to save and access your chat history
              </p>
              <Button variant="outline" size="sm" onClick={onLogin} data-testid="btn-sidebar-login">
                Log in
              </Button>
            </div>
          ) : conversations.length === 0 ? (
            <p
              className="text-sm text-gray-400 text-center py-4"
              data-testid="sidebar-no-conversations"
            >
              No conversations yet
            </p>
          ) : (
            <>
              {pinnedConversations.length > 0 && (
                <>
                  <div className="px-3 py-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pinned
                  </div>
                  {pinnedConversations.map(conv => (
                    <ConversationItem
                      key={conv.id}
                      conversation={conv}
                      isActive={conv.id === currentConversationId}
                      onClick={() => onConversationSelect(conv.id)}
                      onDelete={() => handleDelete(conv.id)}
                      onPin={() => handlePin(conv.id)}
                    />
                  ))}
                  <div className="border-b border-gray-200 my-2" />
                </>
              )}
              {unpinnedConversations.map(conv => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isActive={conv.id === currentConversationId}
                  onClick={() => onConversationSelect(conv.id)}
                  onDelete={() => handleDelete(conv.id)}
                  onPin={() => handlePin(conv.id)}
                />
              ))}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
