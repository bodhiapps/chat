import { useEffect, useState, useRef } from 'react';
import { toast } from 'sonner';
import { markdownProcessor } from '@/lib/markdown/processor';
import { preprocessLaTeX } from '@/lib/markdown/latex-protection';
import { CodePreviewDialog } from './CodePreviewDialog';
import { cn } from '@/lib/utils';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  const [renderedHtml, setRenderedHtml] = useState('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewCode, setPreviewCode] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const renderMarkdown = async () => {
      try {
        const processedContent = preprocessLaTeX(content);
        const result = await markdownProcessor.process(processedContent);
        setRenderedHtml(String(result));
      } catch (error) {
        console.error('Markdown rendering error:', error);
        setRenderedHtml(`<pre>${content}</pre>`);
      }
    };

    renderMarkdown();
  }, [content]);

  useEffect(() => {
    if (!containerRef.current) return;

    const handleCopyClick = async (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const button = target.closest('.copy-code-btn');
      if (!button) return;

      const codeId = button.getAttribute('data-code-id');
      if (!codeId) return;

      const codeElement = containerRef.current?.querySelector(
        `code[data-code-id="${codeId}"]`
      ) as HTMLElement;

      if (!codeElement) return;

      try {
        await navigator.clipboard.writeText(codeElement.textContent || '');
        toast.success('Copied to clipboard');
      } catch (err) {
        console.error('Copy failed:', err);
        toast.error('Failed to copy');
      }
    };

    const handlePreviewClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const button = target.closest('.preview-code-btn');
      if (!button) return;

      const codeId = button.getAttribute('data-code-id');
      if (!codeId) return;

      const codeElement = containerRef.current?.querySelector(
        `code[data-code-id="${codeId}"]`
      ) as HTMLElement;

      if (!codeElement) return;

      setPreviewCode(codeElement.textContent || '');
      setPreviewOpen(true);
    };

    const container = containerRef.current;
    container.addEventListener('click', handleCopyClick);
    container.addEventListener('click', handlePreviewClick);

    return () => {
      container.removeEventListener('click', handleCopyClick);
      container.removeEventListener('click', handlePreviewClick);
    };
  }, [renderedHtml]);

  return (
    <>
      <div
        ref={containerRef}
        className={cn('markdown-content prose prose-sm max-w-none dark:prose-invert', className)}
        dangerouslySetInnerHTML={{ __html: renderedHtml }}
      />
      <CodePreviewDialog open={previewOpen} onOpenChange={setPreviewOpen} code={previewCode} />
    </>
  );
}
