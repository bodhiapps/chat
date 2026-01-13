import { MessageSquare, Pin, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Conversation } from '@/db/schema';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
  onPin: () => void;
}

export function ConversationItem({
  conversation,
  isActive,
  onClick,
  onDelete,
  onPin,
}: ConversationItemProps) {
  return (
    <div
      className={cn(
        'group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer hover:bg-accent overflow-hidden',
        isActive && 'bg-accent'
      )}
      onClick={onClick}
      data-testid="conversation-item"
      data-teststate={conversation.pinned ? 'pinned' : 'unpinned'}
      data-conversation-id={conversation.id}
      data-test-chat-id={conversation.id}
    >
      <MessageSquare size={16} className="shrink-0 text-muted-foreground" />
      <span className="flex-1 min-w-0 text-sm truncate">
        {conversation.name.replace(/\n/g, ' ')}
      </span>
      <button
        onClick={e => {
          e.stopPropagation();
          onPin();
        }}
        className={cn(
          'shrink-0 p-1 hover:bg-accent rounded',
          conversation.pinned ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        )}
        title={conversation.pinned ? 'Unpin conversation' : 'Pin conversation'}
        data-testid="btn-pin-conversation"
      >
        <Pin
          size={14}
          className={cn(
            conversation.pinned ? 'text-blue-600 fill-blue-600' : 'text-muted-foreground'
          )}
        />
      </button>
      <button
        onClick={e => {
          e.stopPropagation();
          onDelete();
        }}
        className="shrink-0 opacity-0 group-hover:opacity-100 p-1 hover:bg-accent rounded"
        title="Delete conversation"
        data-testid="btn-delete-conversation"
      >
        <Trash2 size={14} className="text-red-600" />
      </button>
    </div>
  );
}
