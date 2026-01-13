import { useMemo } from 'react';
import { Keyboard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ShortcutGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
  category: 'global' | 'chat' | 'message';
}

function getPlatformModifierKey(): string {
  return typeof navigator !== 'undefined' && navigator.platform?.includes('Mac') ? '⌘' : 'Ctrl';
}

export function ShortcutGuideModal({ isOpen, onClose }: ShortcutGuideModalProps) {
  const modKey = useMemo(() => getPlatformModifierKey(), []);

  const shortcuts: ShortcutItem[] = [
    // Global shortcuts
    { keys: [modKey, 'K'], description: 'Open search modal', category: 'global' },
    { keys: [modKey, 'Shift', 'O'], description: 'Create new conversation', category: 'global' },
    { keys: ['Esc'], description: 'Close active modal', category: 'global' },
    { keys: ['?'], description: 'Show this keyboard shortcuts guide', category: 'global' },
    { keys: ['/'], description: 'Focus chat input', category: 'global' },

    // Chat shortcuts
    { keys: ['Enter'], description: 'Send message', category: 'chat' },
    { keys: ['Shift', 'Enter'], description: 'Insert new line', category: 'chat' },

    // Message shortcuts
    { keys: ['Enter'], description: 'Save edited message', category: 'message' },
    { keys: ['Esc'], description: 'Cancel message edit', category: 'message' },
  ];

  const groupedShortcuts = {
    global: shortcuts.filter(s => s.category === 'global'),
    chat: shortcuts.filter(s => s.category === 'chat'),
    message: shortcuts.filter(s => s.category === 'message'),
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-2xl" data-testid="shortcut-guide-modal">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Keyboard className="w-5 h-5 text-primary" />
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </div>
          <DialogDescription>
            Quick reference for all available keyboard shortcuts
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Global Shortcuts */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Global Navigation
              </h3>
              <div className="space-y-2">
                {groupedShortcuts.global.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                    data-testid="shortcut-item"
                  >
                    <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex} className="flex items-center gap-1">
                          <kbd className="px-2 py-1 text-xs font-semibold bg-background border border-border rounded shadow-sm">
                            {key}
                          </kbd>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="text-xs text-muted-foreground">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Chat Shortcuts */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Chat Input
              </h3>
              <div className="space-y-2">
                {groupedShortcuts.chat.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                    data-testid="shortcut-item"
                  >
                    <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex} className="flex items-center gap-1">
                          <kbd className="px-2 py-1 text-xs font-semibold bg-background border border-border rounded shadow-sm">
                            {key}
                          </kbd>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="text-xs text-muted-foreground">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Message Editing Shortcuts */}
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                Message Editing
              </h3>
              <div className="space-y-2">
                {groupedShortcuts.message.map((shortcut, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50 hover:bg-muted transition-colors"
                    data-testid="shortcut-item"
                  >
                    <span className="text-sm text-muted-foreground">{shortcut.description}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIndex) => (
                        <span key={keyIndex} className="flex items-center gap-1">
                          <kbd className="px-2 py-1 text-xs font-semibold bg-background border border-border rounded shadow-sm">
                            {key}
                          </kbd>
                          {keyIndex < shortcut.keys.length - 1 && (
                            <span className="text-xs text-muted-foreground">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform note */}
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                {modKey === '⌘' ? (
                  <>
                    On macOS, <kbd className="px-1 py-0.5 bg-muted rounded text-xs">⌘</kbd>{' '}
                    represents the Command key
                  </>
                ) : (
                  <>
                    On Windows/Linux,{' '}
                    <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl</kbd> represents the
                    Control key
                  </>
                )}
              </p>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
