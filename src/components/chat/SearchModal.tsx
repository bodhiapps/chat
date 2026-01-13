import { useEffect, useRef, useMemo } from 'react';
import { Search, MessageSquare, User, Bot } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSearch } from '@/hooks/useSearch';
import type { SearchResult } from '@/hooks/useSearch';

function getPlatformModifierKey(): string {
  return typeof navigator !== 'undefined' && navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl';
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResultClick: (conversationId: string, messageId: string) => void;
  userId: string | null;
}

export function SearchModal({ isOpen, onClose, onResultClick, userId }: SearchModalProps) {
  const { query, setQuery, results, isSearching, search, clearResults } = useSearch(userId);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<number | undefined>(undefined);
  const modKey = useMemo(() => getPlatformModifierKey(), []);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    } else {
      clearResults();
    }
  }, [isOpen, clearResults]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      search(value);
    }, 300);
  };

  const handleResultClick = (conversationId: string, messageId: string) => {
    onResultClick(conversationId, messageId);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh]" data-testid="search-modal">
        <DialogHeader>
          <DialogTitle>Search Conversations</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            ref={inputRef}
            value={query}
            onChange={e => handleQueryChange(e.target.value)}
            placeholder={`Search all messages... (${modKey}+K)`}
            className="pl-9"
            data-testid="search-input"
          />
        </div>

        <ScrollArea className="max-h-96 mt-4">
          {isSearching ? (
            <div className="text-center py-4 text-muted-foreground">Searching...</div>
          ) : results.length === 0 && query ? (
            <div className="text-center py-4 text-muted-foreground">No results found</div>
          ) : (
            <div className="space-y-4">
              {results.map(result => (
                <SearchResultGroup
                  key={result.conversation.id}
                  result={result}
                  query={query}
                  onMessageClick={handleResultClick}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function SearchResultGroup({
  result,
  query,
  onMessageClick,
}: {
  result: SearchResult;
  query: string;
  onMessageClick: (convId: string, msgId: string) => void;
}) {
  return (
    <div
      className="border rounded-lg p-3"
      data-testid="search-result-group"
      data-conversation-id={result.conversation.id}
    >
      <div className="flex items-center gap-2 mb-2">
        <MessageSquare size={14} className="text-muted-foreground" />
        <span className="font-medium text-sm truncate">{result.conversation.name}</span>
      </div>

      <div className="space-y-2">
        {result.messages.map(({ message, snippet }) => (
          <button
            key={message.id}
            onClick={() => onMessageClick(result.conversation.id, message.id)}
            className="w-full text-left p-2 rounded hover:bg-accent flex items-start gap-2"
            data-testid="search-result-message"
            data-message-id={message.id}
          >
            {message.role === 'user' ? (
              <User size={14} className="text-muted-foreground mt-0.5 flex-shrink-0" />
            ) : (
              <Bot size={14} className="text-muted-foreground mt-0.5 flex-shrink-0" />
            )}
            <span
              className="text-sm text-foreground"
              dangerouslySetInnerHTML={{ __html: highlightMatch(snippet, query) }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

function highlightMatch(text: string, query: string): string {
  if (!query) return text;
  const regex = new RegExp(`(${escapeRegex(query)})`, 'gi');
  return text.replace(regex, '<mark class="bg-primary/20 rounded px-0.5">$1</mark>');
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
