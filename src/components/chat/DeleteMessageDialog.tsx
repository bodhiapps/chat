import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface DeleteMessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  cascadeCount: number;
}

export function DeleteMessageDialog({
  isOpen,
  onClose,
  onConfirm,
  cascadeCount,
}: DeleteMessageDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent data-testid="delete-message-dialog" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Delete Message</DialogTitle>
          <DialogDescription>
            {cascadeCount > 1 ? (
              <>
                This will delete this message and{' '}
                <span data-testid="delete-cascade-count" className="font-medium text-foreground">
                  {cascadeCount - 1} following message{cascadeCount - 1 > 1 ? 's' : ''}
                </span>
                . This action cannot be undone.
              </>
            ) : (
              'Are you sure you want to delete this message? This action cannot be undone.'
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="btn-cancel-delete">
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} data-testid="btn-confirm-delete">
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
