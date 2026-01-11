/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { useChat } from '@/hooks/useChat';
import { usePersistence } from '@/hooks/usePersistence';
import type { ChatMessage } from '@/hooks/useChat';

interface ChatContextValue {
  messages: ChatMessage[];
  isStreaming: boolean;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  sendMessage: (prompt: string) => Promise<void>;
  clearMessages: () => void;
  regenerateLastMessage: () => Promise<void>;
  error: string | null;
  models: string[];
  isLoadingModels: boolean;
  loadModels: () => Promise<void>;
  currentConversationId: string | null;
  loadConversation: (id: string) => Promise<void>;
  startNewConversation: () => void;
  isLoadingConversation: boolean;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const chat = useChat();
  const persistence = usePersistence();
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [prevStreamingState, setPrevStreamingState] = useState(false);

  useEffect(() => {
    if (chat.error) {
      toast.error(chat.error, {
        onDismiss: chat.clearError,
        onAutoClose: chat.clearError,
      });
    }
  }, [chat.error, chat.clearError]);

  const loadConversation = useCallback(
    async (id: string) => {
      setIsLoadingConversation(true);
      const messages = await persistence.loadMessages(id);
      chat.setMessages(messages);
      setCurrentConversationId(id);
      setIsLoadingConversation(false);
    },
    [persistence, chat]
  );

  useEffect(() => {
    const loadLatestConversation = async () => {
      const conversations = await persistence.listConversations();
      if (conversations.length > 0 && !currentConversationId) {
        const latest = conversations[0];
        await loadConversation(latest.id);
      }
    };
    loadLatestConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (prevStreamingState && !chat.isStreaming && currentConversationId) {
      const lastMessage = chat.messages[chat.messages.length - 1];
      if (lastMessage?.role === 'assistant') {
        persistence.saveMessage(currentConversationId, lastMessage, chat.selectedModel);
      }
    }
    setPrevStreamingState(chat.isStreaming);
  }, [
    chat.isStreaming,
    chat.messages,
    chat.selectedModel,
    currentConversationId,
    persistence,
    prevStreamingState,
  ]);

  const handleSendMessage = useCallback(
    async (prompt: string) => {
      if (!currentConversationId && prompt.trim()) {
        const title = persistence.generateConversationTitle(prompt);
        const newId = await persistence.createConversation(title);
        setCurrentConversationId(newId);
        await persistence.saveMessage(newId, { role: 'user', content: prompt }, chat.selectedModel);
      } else if (currentConversationId) {
        await persistence.saveMessage(
          currentConversationId,
          { role: 'user', content: prompt },
          chat.selectedModel
        );
      }

      await chat.sendMessage(prompt);
    },
    [chat, currentConversationId, persistence]
  );

  const startNewConversation = useCallback(() => {
    chat.clearMessages();
    setCurrentConversationId(null);
  }, [chat]);

  const value: ChatContextValue = {
    ...chat,
    sendMessage: handleSendMessage,
    currentConversationId,
    loadConversation,
    startNewConversation,
    isLoadingConversation,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}
