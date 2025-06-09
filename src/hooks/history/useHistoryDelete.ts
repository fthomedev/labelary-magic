
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
    console.log('Delete button clicked for record:', record.id);
    setRecordToDelete(record);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async (): Promise<boolean> => {
    if (!recordToDelete) {
      console.log('No record to delete');
      return false;
    }

    console.log('Starting deletion process for record:', recordToDelete.id);
    setIsDeleting(true);
    
    try {
      // Check if user is authenticated
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        console.error('Authentication error:', sessionError);
        toast({
          title: t('error'),
          description: t('authenticationRequired') || 'Authentication required',
          variant: 'destructive',
        });
        return false;
      }

      console.log('User authenticated, proceeding with deletion');
      console.log('Record to delete:', {
        id: recordToDelete.id,
        pdfPath: recordToDelete.pdfPath,
        userId: sessionData.session.user.id
      });

      // Delete the file from storage if it exists
      if (recordToDelete.pdfPath) {
        console.log('Attempting to delete file from storage:', recordToDelete.pdfPath);
        
        const { error: storageError } = await supabase.storage
          .from('pdfs')
          .remove([recordToDelete.pdfPath]);
        
        if (storageError) {
          console.error('Storage deletion error:', storageError);
          // Continue with database deletion even if storage deletion fails
        } else {
          console.log('File successfully deleted from storage');
        }
      } else {
        console.log('No pdfPath found, skipping storage deletion');
      }

      // Delete the record from the database
      console.log('Attempting to delete record from database');
      const { error: dbError, data: deleteData } = await supabase
        .from('processing_history')
        .delete()
        .eq('id', recordToDelete.id)
        .eq('user_id', sessionData.session.user.id); // Extra security check

      if (dbError) {
        console.error('Database deletion error:', dbError);
        toast({
          title: t('error'),
          description: t('deleteRecordError') || 'Error deleting record',
          variant: 'destructive',
        });
        return false;
      }

      console.log('Database deletion successful. Deleted data:', deleteData);
      
      toast({
        title: t('success'),
        description: t('recordDeletedSuccessfully') || 'Record deleted successfully',
      });

      // Close dialog and reset state
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
      
      console.log('Deletion process completed successfully');
      return true;

    } catch (error) {
      console.error('Unexpected error during deletion:', error);
      toast({
        title: t('error'),
        description: t('deleteRecordError') || 'Error deleting record',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  const closeDeleteDialog = () => {
    console.log('Closing delete dialog');
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
