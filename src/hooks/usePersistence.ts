import { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/db/database';
import type { Conversation, Message } from '@/db/schema';
import type { ChatMessage } from './useChat';

export function usePersistence() {
  const createConversation = useCallback(async (name: string): Promise<string> => {
    const id = uuidv4();
    const conversation: Conversation = {
      id,
      name,
      lastModified: Date.now(),
    };
    await db.conversations.add(conversation);
    return id;
  }, []);

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

  const loadConversation = useCallback(async (id: string): Promise<Conversation | undefined> => {
    return await db.conversations.get(id);
  }, []);

  const listConversations = useCallback(async (): Promise<Conversation[]> => {
    return await db.conversations.orderBy('lastModified').reverse().toArray();
  }, []);

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
      await db.messages.add(dbMessage);
      await db.conversations.update(convId, { lastModified: Date.now() });
    },
    []
  );

  const loadMessages = useCallback(async (convId: string): Promise<ChatMessage[]> => {
    const messages = await db.messages.where('convId').equals(convId).sortBy('createdAt');
    return messages
      .filter(msg => msg.role === 'user' || msg.role === 'assistant')
      .map(msg => ({
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
    loadConversation,
    listConversations,
    saveMessage,
    loadMessages,
    generateConversationTitle,
  };
}
