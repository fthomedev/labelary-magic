
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { ProcessingRecord } from '@/hooks/useZplConversion';
import { useToast } from '@/hooks/use-toast';

// Interface para o resultado da função de deleção
interface DeleteResult {
  success: boolean;
  deleted_count: number;
  pdf_path?: string;
  error?: string;
  diagnostics?: {
    user_authenticated: boolean;
    user_id: string;
    record_exists: boolean;
    record_belongs_to_user: boolean;
    record_id: string;
  };
}

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
      // Step 1: Verificar autenticação
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
      
      // Step 2: Usar a função segura do Supabase para deletar
      console.log('Calling delete_processing_history_record function...');
      const { data, error: deleteError } = await supabase
        .rpc('delete_processing_history_record', { 
          record_id: recordToDelete.id 
        }) as { data: DeleteResult | null; error: any };

      if (deleteError) {
        console.error('RPC deletion error:', deleteError);
        throw new Error(`Database function error: ${deleteError.message}`);
      }

      console.log('Delete function result:', data);
      
      if (!data) {
        throw new Error('No result returned from delete function');
      }

      const deleteResult = data as DeleteResult;

      // Step 3: Verificar o resultado da função
      if (!deleteResult.success) {
        console.error('Deletion failed:', deleteResult);
        
        // Log diagnósticos para debugging
        if (deleteResult.diagnostics) {
          console.log('🔍 Delete diagnostics:', deleteResult.diagnostics);
        }
        
        const errorMsg = deleteResult.error || 'Unknown deletion error';
        throw new Error(errorMsg);
      }

      console.log('Database deletion successful, deleted count:', deleteResult.deleted_count);

      // Step 4: Deletar arquivo do storage se existir
      if (deleteResult.pdf_path) {
        console.log('Deleting file from storage:', deleteResult.pdf_path);
        
        const { error: storageError } = await supabase.storage
          .from('pdfs')
          .remove([deleteResult.pdf_path]);
        
        if (storageError) {
          console.error('Storage deletion error:', storageError);
          // Não falhar se a deleção do storage falhar
        } else {
          console.log('File successfully deleted from storage');
        }
      } else {
        console.log('No pdf_path found, skipping storage deletion');
      }

      toast({
        title: t('success') || 'Success',
        description: t('recordDeletedSuccessfully') || 'Record deleted successfully',
      });

      // Fechar dialog e resetar estado
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
