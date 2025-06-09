
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

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<boolean>;
  isDeleting?: boolean;
}

export function DeleteConfirmDialog({ 
  open, 
  onOpenChange, 
  onConfirm,
  isDeleting = false 
}: DeleteConfirmDialogProps) {
  const { t } = useTranslation();

  const handleConfirm = async () => {
    console.log('Delete confirm button clicked');
    const success = await onConfirm();
    console.log('Delete operation completed with success:', success);
    // The dialog will be closed by the parent component if deletion is successful
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('deleteRecordConfirm')}</DialogTitle>
          <DialogDescription>{t('deleteRecordWarning')}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            {t('cancel')}
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? t('deleting') || 'Deleting...' : t('delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
