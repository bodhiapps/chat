/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';
import { useChat } from '@/hooks/useChat';
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
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const chat = useChat();

  useEffect(() => {
    if (chat.error) {
      toast.error(chat.error, {
        onDismiss: chat.clearError,
        onAutoClose: chat.clearError,
      });
    }
  }, [chat.error, chat.clearError]);

  return <ChatContext.Provider value={chat}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}
