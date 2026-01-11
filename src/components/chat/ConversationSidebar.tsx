import { useEffect, useState, useCallback } from 'react';
import { PanelLeftClose, PanelLeft, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
}

export function ConversationSidebar({
  isCollapsed,
  onToggle,
  currentConversationId,
  onConversationSelect,
  onNewConversation,
}: ConversationSidebarProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const { listConversations, deleteConversation } = usePersistence();

  const loadConversations = useCallback(async () => {
    const convs = await listConversations();
    setConversations(convs);
  }, [listConversations]);

  useEffect(() => {
    loadConversations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id: string) => {
    await deleteConversation(id);
    if (currentConversationId === id) {
      onNewConversation();
    }
    await loadConversations();
  };

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
    <div className="w-64 border-r bg-white flex flex-col" data-testid="conversation-sidebar">
      <div className="p-3 border-b space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">Conversations</h2>
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

        <Button
          onClick={onNewConversation}
          className="w-full justify-start gap-2"
          variant="outline"
          size="sm"
          data-testid="btn-new-conversation"
        >
          <Plus size={16} />
          New chat
        </Button>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search conversations"
            className="pl-9 text-sm"
            data-testid="input-search-conversations"
            disabled
          />
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {conversations.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No conversations yet</p>
          ) : (
            conversations.map(conv => (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                isActive={conv.id === currentConversationId}
                onClick={() => onConversationSelect(conv.id)}
                onDelete={() => handleDelete(conv.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
