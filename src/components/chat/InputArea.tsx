import { useState } from 'react';
import { useBodhi } from '@bodhiapp/bodhi-js-react';
import { Plus, RefreshCw, ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  const {
    sendMessage,
    clearMessages,
    selectedModel,
    setSelectedModel,
    models,
    isLoadingModels,
    loadModels,
  } = useChatContext();
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
    await sendMessage(messageToSend);
  };

  const handleNewChat = () => {
    clearMessages();
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
              onClick={loadModels}
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
