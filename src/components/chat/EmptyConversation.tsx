import { MessageCircle } from 'lucide-react';

interface EmptyConversationProps {
  currentConversationId?: string | null;
}

export function EmptyConversation({ currentConversationId }: EmptyConversationProps) {
  return (
    <div
      className="flex-1 flex flex-col items-center justify-center bg-muted px-6"
      data-testid="chat-area"
      data-teststate="idle"
      data-test-chat-id={currentConversationId || ''}
      data-test-message-count={0}
    >
      {/* Animated gradient orb */}
      <div className="relative mb-8">
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 via-accent/20 to-primary/10 blur-2xl animate-pulse" />
        <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-card to-muted border border-border/50 shadow-lg flex items-center justify-center">
          <MessageCircle className="w-10 h-10 text-muted-foreground/70" strokeWidth={1.5} />
        </div>
      </div>

      {/* Text content */}
      <h2 className="text-xl font-semibold text-foreground mb-2 tracking-tight">
        Start a conversation
      </h2>
      <p className="text-muted-foreground text-center max-w-sm leading-relaxed mb-6">
        Type a message below to begin chatting with the AI assistant
      </p>

      {/* Keyboard shortcut hint */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground/60">
        <span>Press</span>
        <kbd className="px-2 py-1 rounded-md bg-card border border-border/50 font-mono text-[10px] shadow-sm">
          /
        </kbd>
        <span>to focus input</span>
      </div>
    </div>
  );
}
