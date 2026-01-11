import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/db/database';
import type { Conversation, Message } from '@/db/schema';
import type { ChatMessage } from './useChat';
import { QuotaCleanupError } from '@/types/errors';

export function usePersistence(userId: string | null) {
  const cleanupOldestConversations = useCallback(
    async (count: number = 3): Promise<string[]> => {
      if (!userId) return [];

      const conversations = await db.conversations
        .where('userId')
        .equals(userId)
        .filter(conv => !conv.pinned)
        .sortBy('lastModified');

      const toDelete = conversations.slice(0, count);
      const deletedIds: string[] = [];

      for (const conv of toDelete) {
        await db.transaction('rw', db.conversations, db.messages, async () => {
          await db.messages.where('convId').equals(conv.id).delete();
          await db.conversations.delete(conv.id);
        });
        deletedIds.push(conv.id);
      }

      return deletedIds;
    },
    [userId]
  );

  const createConversation = useCallback(
    async (name: string): Promise<string> => {
      if (!userId) throw new Error('User not authenticated');

      const id = uuidv4();
      const conversation: Conversation = {
        id,
        userId,
        name,
        lastModified: Date.now(),
        pinned: false,
      };
      await db.conversations.add(conversation);
      return id;
    },
    [userId]
  );

  const deleteConversation = useCallback(async (id: string): Promise<void> => {
    await db.transaction('rw', db.conversations, db.messages, async () => {
      await db.messages.where('convId').equals(id).delete();
      await db.conversations.delete(id);
    });
  }, []);

  const renameConversation = useCallback(async (id: string, name: string): Promise<void> => {
    await db.conversations.update(id, {
      name,
      lastModified: Date.now(),
    });
  }, []);

  const togglePin = useCallback(async (id: string): Promise<boolean> => {
    const conv = await db.conversations.get(id);
    if (!conv) return false;

    const newPinned = !conv.pinned;
    await db.conversations.update(id, { pinned: newPinned });
    return newPinned;
  }, []);

  const loadConversation = useCallback(
    async (id: string): Promise<Conversation | undefined> => {
      if (!userId) return undefined;

      const conv = await db.conversations.get(id);
      // Verify conversation belongs to current user
      if (conv && conv.userId !== userId) {
        return undefined;
      }
      return conv;
    },
    [userId]
  );

  const listConversations = useCallback(async (): Promise<Conversation[]> => {
    if (!userId) return [];

    const all = await db.conversations
      .where('userId')
      .equals(userId)
      .reverse()
      .sortBy('lastModified');
    return all.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return b.lastModified - a.lastModified;
    });
  }, [userId]);

  const saveMessage = useCallback(
    async (convId: string, message: ChatMessage, model?: string): Promise<void> => {
      const dbMessage: Message = {
        id: uuidv4(),
        convId,
        role: message.role,
        content: message.content,
        model,
        createdAt: Date.now(),
      };

      try {
        await db.messages.add(dbMessage);
        await db.conversations.update(convId, { lastModified: Date.now() });
      } catch (error) {
        if (error instanceof Error && error.name === 'QuotaExceededError') {
          await cleanupOldestConversations(3);
          await db.messages.add(dbMessage);
          await db.conversations.update(convId, { lastModified: Date.now() });
          throw new QuotaCleanupError('Cleaned up old conversations to free space');
        }
        throw error;
      }
    },
    [cleanupOldestConversations]
  );

  const loadMessages = useCallback(async (convId: string): Promise<ChatMessage[]> => {
    const messages = await db.messages.where('convId').equals(convId).sortBy('createdAt');
    return messages
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .map(msg => ({
        id: msg.id,
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));
  }, []);

  const generateConversationTitle = useCallback((firstMessage: string): string => {
    const maxLength = 50;
    const title = firstMessage.trim();
    if (title.length <= maxLength) {
      return title;
    }
    return title.substring(0, maxLength) + '...';
  }, []);

  return {
    createConversation,
    deleteConversation,
    renameConversation,
    togglePin,
    loadConversation,
    listConversations,
    saveMessage,
    loadMessages,
    generateConversationTitle,
  };
}
