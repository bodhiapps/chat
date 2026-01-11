import { useState, useEffect, useCallback, useRef } from 'react';
import { useBodhi } from '@bodhiapp/bodhi-js-react';
import { Plus, RefreshCw, ArrowUp } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface MessageProps {
  role: 'user' | 'assistant';
  content: string;
}

function Message({ role, content }: MessageProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        data-testid={isUser ? 'message-user' : 'message-assistant'}
        className={`max-w-[70%] px-4 py-2 rounded-lg ${
          isUser ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'
        }`}
      >
        <div className="whitespace-pre-wrap break-words">{content}</div>
      </div>
    </div>
  );
}

interface ChatAreaProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  error?: string | null;
}

function ChatArea({ messages, isStreaming, error }: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const isUserScrolledUpRef = useRef(false);
  const prevMessagesLengthRef = useRef(0);

  useEffect(() => {
    const viewport = scrollViewportRef.current;
    if (!viewport) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 50;
      isUserScrolledUpRef.current = !isAtBottom;
    };

    viewport.addEventListener('scroll', handleScroll);
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    const isNewUserMessage =
      messages.length > prevMessagesLengthRef.current && lastMessage?.role === 'user';

    if (isNewUserMessage) {
      isUserScrolledUpRef.current = false;
    }

    prevMessagesLengthRef.current = messages.length;
  }, [messages]);

  useEffect(() => {
    if (!isUserScrolledUpRef.current) {
      messagesEndRef.current?.scrollIntoView({
        behavior: isStreaming ? 'instant' : 'smooth',
      });
    }
  }, [messages, isStreaming]);

  return (
    <ScrollArea
      className="flex-1 overflow-hidden"
      data-testid="chat-area"
      data-teststate={error ? 'error' : isStreaming ? 'streaming' : 'idle'}
      ref={(node: HTMLDivElement | null) => {
        if (node) {
          const viewport = node.querySelector(
            '[data-slot="scroll-area-viewport"]'
          ) as HTMLDivElement;
          if (viewport) {
            scrollViewportRef.current = viewport;
          }
        }
      }}
    >
      <div className="p-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <p className="text-center text-gray-400 mt-8">No messages yet. Start a conversation!</p>
          ) : (
            <>
              {messages.map((msg, index) => (
                <Message key={index} role={msg.role} content={msg.content} />
              ))}
              {isStreaming && (
                <div data-testid="streaming-indicator" className="flex justify-start mb-4">
                  <div className="bg-gray-200 px-4 py-2 rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse" />
                      <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse delay-100" />
                      <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse delay-200" />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}

interface InputAreaProps {
  onSendMessage: (message: string) => Promise<void>;
  onClearMessages: () => void;
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  models: string[];
  isLoadingModels: boolean;
  onRefreshModels: () => void;
}

function InputArea({
  onSendMessage,
  onClearMessages,
  selectedModel,
  setSelectedModel,
  models,
  isLoadingModels,
  onRefreshModels,
}: InputAreaProps) {
  const { isReady, isAuthenticated } = useBodhi();
  const [message, setMessage] = useState('');

  const isDisabled = !isReady || !isAuthenticated;

  const getHintText = () => {
    if (!isReady) return 'Client not ready';
    if (!isAuthenticated) return 'Please log in to send messages';
    return 'Type a message...';
  };

  const handleSubmit = async () => {
    if (isDisabled || !message.trim()) return;
    const messageToSend = message;
    setMessage('');
    await onSendMessage(messageToSend);
  };

  const handleNewChat = () => {
    onClearMessages();
    setMessage('');
  };

  return (
    <div className="w-full px-4 py-4">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-[auto_1fr_auto] grid-rows-[1fr_auto] gap-2 p-3 bg-white border border-gray-200 rounded-3xl shadow-sm">
          <Button
            onClick={handleNewChat}
            variant="ghost"
            size="icon"
            title="New chat"
            disabled={isDisabled}
            className="row-span-2 self-center"
          >
            <Plus />
          </Button>

          <Input
            data-testid="chat-input"
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder={getHintText()}
            disabled={isDisabled}
            className="col-start-2 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />

          <div className="col-start-2 flex items-center gap-2 justify-end">
            <Select
              value={selectedModel}
              onValueChange={setSelectedModel}
              disabled={models.length === 0}
            >
              <SelectTrigger
                data-testid="model-selector"
                className="w-[240px] border-0 focus:ring-0"
              >
                <SelectValue placeholder="No models" />
              </SelectTrigger>
              <SelectContent>
                {models.map(model => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              data-testid="btn-refresh-models"
              onClick={onRefreshModels}
              variant="ghost"
              size="icon"
              title="Refresh models"
              disabled={isLoadingModels}
            >
              <RefreshCw className={isLoadingModels ? 'animate-spin' : ''} size={18} />
            </Button>
          </div>

          <Button
            data-testid="send-button"
            onClick={handleSubmit}
            disabled={isDisabled || !message.trim()}
            variant="ghost"
            size="icon"
            className="row-span-2 col-start-3 self-center"
            title="Send message"
          >
            <ArrowUp />
          </Button>
        </div>
      </div>
    </div>
  );
}

function useChat() {
  const { client, isAuthenticated, isReady } = useBodhi();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [models, setModels] = useState<string[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isLoadingModelsRef = useRef(false);
  const hasAttemptedLoadRef = useRef(false);

  const loadModels = useCallback(async () => {
    if (isLoadingModelsRef.current) return;
    isLoadingModelsRef.current = true;

    setIsLoadingModels(true);
    setError(null);
    try {
      if (!isAuthenticated) {
        setError('Please log in to load models');
        return;
      }

      const modelIds: string[] = [];
      const response = client.models.list();

      if (!response || typeof response[Symbol.asyncIterator] !== 'function') {
        throw new Error('Invalid response from server');
      }

      for await (const model of response) {
        modelIds.push(model.id);
      }

      setModels(modelIds);
      setSelectedModel(current => {
        if (modelIds.length > 0 && !current) {
          return modelIds[0];
        }
        return current;
      });
    } catch (err) {
      console.error('Failed to fetch models:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch models';
      setError(errorMessage);
    } finally {
      setIsLoadingModels(false);
      isLoadingModelsRef.current = false;
    }
  }, [client, isAuthenticated]);

  useEffect(() => {
    if (isReady && isAuthenticated && !hasAttemptedLoadRef.current && !isLoadingModels) {
      hasAttemptedLoadRef.current = true;
      loadModels();
    }
  }, [isReady, isAuthenticated, isLoadingModels, loadModels]);

  useEffect(() => {
    if (!isAuthenticated) {
      abortControllerRef.current?.abort();
      abortControllerRef.current = null;
      setMessages([]);
      setSelectedModel('');
      setModels([]);
      setError(null);
      hasAttemptedLoadRef.current = false;
    }
  }, [isAuthenticated]);

  const sendMessage = async (prompt: string) => {
    if (!selectedModel) {
      setError('Please select a model first');
      return;
    }

    setError(null);
    setIsStreaming(true);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    const conversationMessages: ChatMessage[] = [...messages, { role: 'user', content: prompt }];

    setMessages(prev => [...prev, { role: 'user', content: prompt }]);
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const stream = client.chat.completions.create({
        model: selectedModel,
        messages: conversationMessages,
        stream: true,
      });

      for await (const chunk of stream) {
        if (abortController.signal.aborted) {
          break;
        }
        const content = chunk.choices?.[0]?.delta?.content || '';
        if (content) {
          setMessages(prev => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;
            updated[lastIndex] = {
              ...updated[lastIndex],
              content: updated[lastIndex].content + content,
            };
            return updated;
          });
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      console.error('Failed to send message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const clearMessages = () => {
    setMessages([]);
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  return {
    messages,
    isStreaming,
    selectedModel,
    setSelectedModel,
    sendMessage,
    clearMessages,
    error,
    clearError,
    models,
    isLoadingModels,
    loadModels,
  };
}

export default function ChatDemo() {
  const {
    messages,
    isStreaming,
    selectedModel,
    setSelectedModel,
    sendMessage,
    clearMessages,
    error: chatError,
    clearError: clearChatError,
    models,
    isLoadingModels,
    loadModels,
  } = useChat();

  useEffect(() => {
    if (chatError) {
      toast.error(chatError, {
        onDismiss: clearChatError,
        onAutoClose: clearChatError,
      });
    }
  }, [chatError, clearChatError]);

  return (
    <>
      <ChatArea messages={messages} isStreaming={isStreaming} error={chatError} />
      <InputArea
        onSendMessage={sendMessage}
        onClearMessages={clearMessages}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        models={models}
        isLoadingModels={isLoadingModels}
        onRefreshModels={loadModels}
      />
    </>
  );
}
