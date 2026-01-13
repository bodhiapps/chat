import { useState, useMemo } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { MarkdownContent } from './MarkdownContent';
import { cn } from '@/lib/utils';

interface ThinkingBlockProps {
  content: string;
  isStreaming?: boolean;
  autoExpand?: boolean;
  className?: string;
}

export function ThinkingBlock({
  content,
  isStreaming = false,
  autoExpand = true,
  className,
}: ThinkingBlockProps) {
  const defaultExpanded = useMemo(() => isStreaming || autoExpand, [isStreaming, autoExpand]);
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div
      className={cn('my-3 border border-border rounded-lg overflow-hidden', className)}
      data-testid="thinking-block"
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-4 py-3 bg-muted/50 hover:bg-muted transition-colors text-left"
        data-testid="thinking-block-toggle"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="font-medium text-sm text-muted-foreground">
          {isStreaming ? 'Thinking...' : 'Reasoning'}
        </span>
      </button>

      {isExpanded && (
        <div className="px-4 py-3 border-t border-border" data-testid="thinking-block-content">
          <MarkdownContent content={content} className="text-sm" />
        </div>
      )}
    </div>
  );
}
