import { useState, useEffect, useCallback, useRef } from 'react';
import { useBodhi } from '@bodhiapp/bodhi-js-react';
import { useSettingsContext } from './useSettingsContext';

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  extra?: {
    reasoning_content?: string;
  };
  error?: {
    message: string;
    retryable: boolean;
  };
}

export function useChat() {
  const { client, isAuthenticated, isReady } = useBodhi();
  const { settings } = useSettingsContext();
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

  const sendMessage = useCallback(
    async (prompt: string) => {
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
        const apiMessages = [
          ...(settings.general.systemMessage
            ? [{ role: 'system' as const, content: settings.general.systemMessage }]
            : []),
          ...conversationMessages,
        ];

        const stream = client.chat.completions.create({
          model: selectedModel,
          messages: apiMessages,
          stream: true,
          temperature: settings.generation.temperature,
          top_p: settings.generation.top_p,
          top_k: settings.generation.top_k,
          min_p: settings.generation.min_p,
          max_tokens:
            settings.generation.max_tokens === -1 ? undefined : settings.generation.max_tokens,
          repeat_penalty: settings.generation.repeat_penalty,
          presence_penalty: settings.generation.presence_penalty,
          frequency_penalty: settings.generation.frequency_penalty,
        });

        for await (const chunk of stream) {
          if (abortController.signal.aborted) {
            break;
          }
          const content = chunk.choices?.[0]?.delta?.content || '';
          const reasoningContent = chunk.choices?.[0]?.delta?.reasoning_content || '';

          if (content || reasoningContent) {
            setMessages(prev => {
              const updated = [...prev];
              const lastIndex = updated.length - 1;
              updated[lastIndex] = {
                ...updated[lastIndex],
                content: updated[lastIndex].content + content,
                extra: {
                  reasoning_content:
                    (updated[lastIndex].extra?.reasoning_content || '') + reasoningContent,
                },
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

        const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
        const isAuthError =
          errorMessage.includes('401') ||
          errorMessage.includes('unauthorized') ||
          errorMessage.includes('token');

        if (isAuthError) {
          setError('Session expired. Please log in again.');
          setMessages(prev => prev.slice(0, -1));
          return;
        }

        setError(errorMessage);
        setMessages(prev => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (updated[lastIndex]?.role === 'assistant') {
            updated[lastIndex] = {
              ...updated[lastIndex],
              error: { message: errorMessage, retryable: true },
            };
          }
          return updated;
        });
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [client, selectedModel, messages, settings]
  );

  const retryMessage = useCallback(
    async (messageIndex: number) => {
      const userMessageIndex = messageIndex - 1;
      if (userMessageIndex < 0 || messages[userMessageIndex]?.role !== 'user') return;

      setMessages(prev => prev.slice(0, -1));
      await sendMessage(messages[userMessageIndex].content);
    },
    [messages, sendMessage]
  );

  const clearMessages = () => {
    setMessages([]);
    setError(null);
  };

  const clearError = () => {
    setError(null);
  };

  const regenerateLastMessage = async () => {
    if (messages.length < 2) return;

    const lastUserMessageIndex = messages.length - 2;
    const lastUserMessage = messages[lastUserMessageIndex];

    if (lastUserMessage.role !== 'user') return;

    setMessages(prev => prev.slice(0, -1));
    await sendMessage(lastUserMessage.content);
  };

  return {
    messages,
    setMessages,
    isStreaming,
    selectedModel,
    setSelectedModel,
    sendMessage,
    retryMessage,
    clearMessages,
    regenerateLastMessage,
    error,
    clearError,
    models,
    isLoadingModels,
    loadModels,
  };
}
