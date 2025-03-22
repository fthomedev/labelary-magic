
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
  onConfirm: () => void;
}

export function DeleteConfirmDialog({ open, onOpenChange, onConfirm }: DeleteConfirmDialogProps) {
  const { t } = useTranslation();

  const handleConfirm = () => {
    onConfirm();
    // No need to close dialog here, it will be closed by the parent component
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="delete-confirmation-description">
        <DialogHeader>
          <DialogTitle>{t('deleteRecordConfirm')}</DialogTitle>
          <DialogDescription id="delete-confirmation-description">{t('deleteRecordWarning')}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            className="hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            {t('cancel')}
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            className="bg-destructive text-white hover:bg-destructive/90 focus:ring-2 focus:ring-destructive/50 focus:ring-offset-2"
          >
            {t('delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
