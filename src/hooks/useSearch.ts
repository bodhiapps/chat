import { useState, useCallback } from 'react';
import { db } from '@/db/database';
import type { Message, Conversation } from '@/db/schema';

export interface SearchResult {
  conversation: Conversation;
  messages: Array<{
    message: Message;
    snippet: string;
  }>;
}

export function useSearch(userId: string | null) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const search = useCallback(
    async (searchQuery: string) => {
      if (!userId || !searchQuery.trim()) {
        setResults([]);
        return;
      }

      setIsSearching(true);

      try {
        const queryLower = searchQuery.toLowerCase();

        // Get only user's conversation IDs first
        const userConversations = await db.conversations.where('userId').equals(userId).toArray();
        const userConvIds = new Set(userConversations.map(c => c.id));

        // Filter messages to only those in user's conversations
        const allMessages = await db.messages.toArray();
        const matchingMessages = allMessages.filter(
          msg => userConvIds.has(msg.convId) && msg.content.toLowerCase().includes(queryLower)
        );

        const grouped = new Map<string, Message[]>();
        for (const msg of matchingMessages) {
          const existing = grouped.get(msg.convId) || [];
          existing.push(msg);
          grouped.set(msg.convId, existing);
        }

        const searchResults: SearchResult[] = [];
        for (const [convId, messages] of grouped) {
          const conv = await db.conversations.get(convId);
          if (!conv) continue;

          searchResults.push({
            conversation: conv,
            messages: messages.map(msg => ({
              message: msg,
              snippet: createSnippet(msg.content, queryLower),
            })),
          });
        }

        searchResults.sort((a, b) => b.conversation.lastModified - a.conversation.lastModified);

        setResults(searchResults);
      } finally {
        setIsSearching(false);
      }
    },
    [userId]
  );

  return {
    query,
    setQuery,
    results,
    isSearching,
    search,
    clearResults: useCallback(() => {
      setQuery('');
      setResults([]);
    }, []),
  };
}

function createSnippet(content: string, query: string, contextLength = 50): string {
  const index = content.toLowerCase().indexOf(query);
  if (index === -1) return content.slice(0, 100);

  const start = Math.max(0, index - contextLength);
  const end = Math.min(content.length, index + query.length + contextLength);

  let snippet = content.slice(start, end);
  if (start > 0) snippet = '...' + snippet;
  if (end < content.length) snippet = snippet + '...';

  return snippet;
}
