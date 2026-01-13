import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';

interface CodePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  code: string;
}

export function CodePreviewDialog({ open, onOpenChange, code }: CodePreviewDialogProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (open && iframeRef.current) {
      const iframe = iframeRef.current;
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(code);
        doc.close();
      }
    }
  }, [open, code]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh]" data-testid="html-preview-dialog">
        <DialogHeader>
          <DialogTitle>HTML Preview</DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="absolute right-4 top-4">
              <X className="h-4 w-4" />
            </Button>
          </DialogClose>
        </DialogHeader>
        <iframe
          ref={iframeRef}
          sandbox="allow-scripts"
          className="w-full h-full border rounded"
          title="HTML Preview"
        />
      </DialogContent>
    </Dialog>
  );
}
