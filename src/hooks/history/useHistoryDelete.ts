
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
      // Step 1: Verify authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error('Authentication error');
      }
      
      if (!session || !session.user) {
        console.error('No active session found');
        throw new Error('User not authenticated');
      }

      console.log('User authenticated:', session.user.id);
      
      // Step 2: Verify record exists and belongs to user
      console.log('Verifying record exists in database...');
      const { data: existingRecord, error: selectError } = await supabase
        .from('processing_history')
        .select('id, user_id, pdf_path')
        .eq('id', recordToDelete.id)
        .eq('user_id', session.user.id)
        .single();

      if (selectError) {
        console.error('Error checking existing record:', selectError);
        if (selectError.code === 'PGRST116') {
          throw new Error('Record not found');
        }
        throw new Error(`Database error: ${selectError.message}`);
      }

      if (!existingRecord) {
        console.error('Record not found or access denied');
        throw new Error('Record not found or access denied');
      }

      console.log('Record found in database:', existingRecord);

      // Step 3: Delete from storage if file exists
      if (existingRecord.pdf_path) {
        console.log('Deleting file from storage:', existingRecord.pdf_path);
        
        const { error: storageError } = await supabase.storage
          .from('pdfs')
          .remove([existingRecord.pdf_path]);
        
        if (storageError) {
          console.error('Storage deletion error:', storageError);
          // Continue with database deletion even if storage fails
        } else {
          console.log('File successfully deleted from storage');
        }
      } else {
        console.log('No pdf_path found, skipping storage deletion');
      }

      // Step 4: Delete from database
      console.log('Deleting record from database...');
      const { error: dbError, count } = await supabase
        .from('processing_history')
        .delete({ count: 'exact' })
        .eq('id', recordToDelete.id)
        .eq('user_id', session.user.id);

      if (dbError) {
        console.error('Database deletion error:', dbError);
        throw new Error(`Database error: ${dbError.message}`);
      }

      console.log('Database deletion result - count:', count);
      
      if (count === 0) {
        console.warn('No records were deleted from database');
        throw new Error('Record deletion failed - no rows affected');
      }

      console.log('Record successfully deleted from database');
      
      toast({
        title: t('success') || 'Success',
        description: t('recordDeletedSuccessfully') || 'Record deleted successfully',
      });

      // Close dialog and reset state
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
      
      console.log('Deletion process completed successfully');
      return true;

    } catch (error) {
      console.error('Error during deletion:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      toast({
        title: t('error') || 'Error',
        description: t('deleteRecordError') || `Error deleting record: ${errorMessage}`,
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
