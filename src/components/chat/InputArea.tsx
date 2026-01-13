import { useState, useRef, useEffect } from 'react';
import { useBodhi, BodhiBadge } from '@bodhiapp/bodhi-js-react';
import { RefreshCw, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useChatContext } from '@/context/ChatContext';

export function InputArea() {
  const { isReady, isAuthenticated } = useBodhi();
  const { sendMessage, selectedModel, setSelectedModel, models, isLoadingModels, loadModels } =
    useChatContext();
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isDisabled = !isReady || !isAuthenticated;

  const getHintText = () => {
    if (!isReady) return 'Client not ready';
    if (!isAuthenticated) return 'Please log in to send messages';
    return 'Type a message...';
  };

  const autoResize = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  useEffect(() => {
    autoResize();
  }, [message]);

  const handleSubmit = async () => {
    if (isDisabled || !message.trim()) return;
    const messageToSend = message;
    setMessage('');
    await sendMessage(messageToSend);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full px-4 py-4">
      <div className="max-w-4xl mx-auto flex items-center gap-3">
        {/* Chat input container */}
        <div className="flex-1">
          <div
            className="flex flex-col gap-2 p-3 bg-card border border-border rounded-3xl shadow-sm"
            data-testid="input-area"
            data-teststate={isDisabled ? 'disabled' : 'ready'}
          >
            {/* Chat input */}
            <Textarea
              ref={textareaRef}
              data-testid="chat-input"
              value={message}
              onChange={e => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={getHintText()}
              disabled={isDisabled}
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none min-h-[40px] max-h-[200px]"
              rows={1}
            />

            {/* Hint, model selector, send button */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Shift</kbd> +{' '}
                <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Enter</kbd> for new line
              </span>
              <div className="flex items-center gap-2">
                <Select
                  value={selectedModel}
                  onValueChange={setSelectedModel}
                  disabled={models.length === 0}
                >
                  <SelectTrigger
                    data-testid="model-selector"
                    data-teststate={
                      isLoadingModels ? 'loading' : models.length === 0 ? 'no-models' : 'ready'
                    }
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
                  onClick={loadModels}
                  variant="ghost"
                  size="icon"
                  title="Refresh models"
                  disabled={isLoadingModels}
                >
                  <RefreshCw className={isLoadingModels ? 'animate-spin' : ''} size={18} />
                </Button>

                <Button
                  data-testid="send-button"
                  onClick={handleSubmit}
                  disabled={isDisabled || !message.trim()}
                  variant="ghost"
                  size="icon"
                  title="Send message"
                >
                  <ArrowUp />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Bodhi Badge */}
        <div className="shrink-0">
          <BodhiBadge size="md" variant="light" />
        </div>
      </div>
    </div>
  );
}
