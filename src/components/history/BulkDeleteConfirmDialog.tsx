
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface BulkDeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void> | void;
  count: number;
  isAll?: boolean;
  isDeleting?: boolean;
}

export function BulkDeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  count,
  isAll = false,
  isDeleting = false,
}: BulkDeleteConfirmDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={(o) => !isDeleting && onOpenChange(o)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('bulkActions.confirmBulkDeleteTitle')}</DialogTitle>
          <DialogDescription>
            {isAll
              ? t('bulkActions.confirmBulkDeleteAllMessage', { count })
              : t('bulkActions.confirmBulkDeleteMessage', { count })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            {t('cancel') || 'Cancel'}
          </Button>
          <Button
            variant="destructive"
            onClick={() => onConfirm()}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('deleting') || 'Deleting...'}
              </>
            ) : (
              t('delete') || 'Delete'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
