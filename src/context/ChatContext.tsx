/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { useBodhi } from '@bodhiapp/bodhi-js-react';
import { useChat } from '@/hooks/useChat';
import { usePersistence } from '@/hooks/usePersistence';
import type { ChatMessage } from '@/hooks/useChat';
import { QuotaCleanupError } from '@/types/errors';

interface ChatContextValue {
  messages: ChatMessage[];
  isStreaming: boolean;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  sendMessage: (prompt: string) => Promise<void>;
  retryMessage: (messageIndex: number) => Promise<void>;
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
  highlightedMessageId: string | null;
  scrollToMessage: (messageId: string) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { auth, isAuthenticated } = useBodhi();
  const userId = isAuthenticated ? (auth.user?.sub ?? null) : null;

  const chat = useChat();
  const persistence = usePersistence(userId);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [prevStreamingState, setPrevStreamingState] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  const scrollToMessage = useCallback((messageId: string) => {
    setHighlightedMessageId(messageId);
    setTimeout(() => setHighlightedMessageId(null), 2000);
  }, []);

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

  // Clear chat state when user logs out
  useEffect(() => {
    if (!isAuthenticated) {
      chat.clearMessages();
      setCurrentConversationId(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Load user's latest conversation when userId changes
  useEffect(() => {
    const loadLatestConversation = async () => {
      if (!userId) return;

      const conversations = await persistence.listConversations();
      if (conversations.length > 0 && !currentConversationId) {
        const latest = conversations[0];
        await loadConversation(latest.id);
      }
    };
    loadLatestConversation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

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
      // Only persist if authenticated
      if (userId) {
        try {
          if (!currentConversationId && prompt.trim()) {
            const title = persistence.generateConversationTitle(prompt);
            const newId = await persistence.createConversation(title);
            setCurrentConversationId(newId);
            await persistence.saveMessage(
              newId,
              { role: 'user', content: prompt },
              chat.selectedModel
            );
          } else if (currentConversationId) {
            await persistence.saveMessage(
              currentConversationId,
              { role: 'user', content: prompt },
              chat.selectedModel
            );
          }
        } catch (error) {
          if (error instanceof QuotaCleanupError) {
            toast.info('Freed up space by removing old conversations');
          }
        }
      }

      await chat.sendMessage(prompt);
    },
    [chat, currentConversationId, persistence, userId]
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
    highlightedMessageId,
    scrollToMessage,
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
