
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { ProcessingRecord } from '@/hooks/useZplConversion';
import { useToast } from '@/hooks/use-toast';

export function useHistoryDelete() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<ProcessingRecord | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleDeleteClick = (record: ProcessingRecord) => {
    setRecordToDelete(record);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return;

    setIsDeleting(true);
    
    try {
      // Check if user is authenticated
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        console.log('No active session found');
        toast({
          title: t('error'),
          description: t('authenticationRequired'),
          variant: 'destructive',
        });
        return;
      }

      // Delete the file from storage if it exists
      if (recordToDelete.pdfPath) {
        console.log('Deleting file from storage:', recordToDelete.pdfPath);
        const { error: storageError } = await supabase.storage
          .from('pdfs')
          .remove([recordToDelete.pdfPath]);
        
        if (storageError) {
          console.error('Error deleting file from storage:', storageError);
          // Continue with database deletion even if storage deletion fails
        } else {
          console.log('File deleted from storage successfully');
        }
      }

      // Delete the record from the database
      const { error: dbError } = await supabase
        .from('processing_history')
        .delete()
        .eq('id', recordToDelete.id)
        .eq('user_id', sessionData.session.user.id); // Extra security check

      if (dbError) {
        console.error('Error deleting record from database:', dbError);
        toast({
          title: t('error'),
          description: t('deleteRecordError'),
          variant: 'destructive',
        });
        return;
      }

      console.log('Record deleted successfully');
      toast({
        title: t('success'),
        description: t('recordDeletedSuccessfully'),
      });

      setDeleteDialogOpen(false);
      setRecordToDelete(null);
      
      // Return success so the parent component can refresh the data
      return true;
    } catch (error) {
      console.error('Failed to delete record:', error);
      toast({
        title: t('error'),
        description: t('deleteRecordError'),
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }

    return false;
  };

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setRecordToDelete(null);
  };

  return {
    isDeleting,
    deleteDialogOpen,
    recordToDelete,
    handleDeleteClick,
    handleDeleteConfirm,
    closeDeleteDialog,
  };
}
