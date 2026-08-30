
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { removeStoragePaths } from '@/lib/storageCleanup';
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
    console.log('🗑️ [DEBUG] Delete button clicked for record:', record.id);
    setRecordToDelete(record);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async (): Promise<boolean> => {
    if (!recordToDelete) {
      console.log('❌ [DEBUG] No record to delete');
      return false;
    }

    console.log('🔄 [DEBUG] Starting deletion process for record:', recordToDelete.id);
    setIsDeleting(true);
    
    try {
      // Step 1: Verificar autenticação
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('❌ [DEBUG] Session error:', sessionError);
        throw new Error('Authentication error');
      }
      
      if (!session || !session.user) {
        console.error('❌ [DEBUG] No active session found');
        throw new Error('User not authenticated');
      }

      console.log('✅ [DEBUG] User authenticated:', session.user.id);
      
      // Step 2: Usar a função segura do Supabase para deletar
      console.log('📡 [DEBUG] Calling delete_processing_history_record function...');
      const { data, error: deleteError } = await supabase
        .rpc('delete_processing_history_record', { 
          record_id: recordToDelete.id 
        });

      if (deleteError) {
        console.error('❌ [DEBUG] RPC deletion error:', deleteError);
        throw new Error(`Database function error: ${deleteError.message}`);
      }

      console.log('📊 [DEBUG] Delete function result:', data);
      
      if (!data) {
        throw new Error('No result returned from delete function');
      }

      const deleteResult = data as unknown as DeleteResult;

      // Step 3: Verificar o resultado da função
      if (!deleteResult.success) {
        console.error('❌ [DEBUG] Deletion failed:', deleteResult);
        
        // Log diagnósticos para debugging
        if (deleteResult.diagnostics) {
          console.log('🔍 [DEBUG] Delete diagnostics:', deleteResult.diagnostics);
        }
        
        const errorMsg = deleteResult.error || 'Unknown deletion error';
        throw new Error(errorMsg);
      }

      console.log('✅ [DEBUG] Database deletion successful, deleted count:', deleteResult.deleted_count);

      // Step 4: Deletar arquivo do storage se existir
      let storageFailed = false;
      if (deleteResult.pdf_path) {
        console.log('🗄️ [DEBUG] Deleting file from storage:', deleteResult.pdf_path);

        const cleanup = await removeStoragePaths('pdfs', [deleteResult.pdf_path]);
        storageFailed = cleanup.failed > 0;

        if (storageFailed) {
          console.error('❌ [DEBUG] Storage deletion error:', cleanup.errors);
        } else {
          console.log('✅ [DEBUG] File successfully deleted from storage');
        }
      } else {
        console.log('ℹ️ [DEBUG] No pdf_path found, skipping storage deletion');
      }

      console.log('🎉 [DEBUG] About to show success toast');
      toast({
        title: storageFailed ? (t('warning') || 'Atenção') : (t('success') || 'Success'),
        description: storageFailed
          ? t('bulkActions.deleteFilePending')
          : (t('recordDeletedSuccessfully') || 'Record deleted successfully'),
      });
      console.log('✅ [DEBUG] Success toast displayed');

      // Fechar dialog e resetar estado
      console.log('🔄 [DEBUG] Closing dialog and resetting state');
      setDeleteDialogOpen(false);
      setRecordToDelete(null);
      
      console.log('🎯 [DEBUG] Deletion process completed successfully');
      return true;

    } catch (error) {
      console.error('💥 [DEBUG] Error during deletion:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      console.log('⚠️ [DEBUG] About to show error toast');
      toast({
        title: t('error') || 'Error',
        description: t('deleteRecordError') || `Error deleting record: ${errorMessage}`,
        variant: 'destructive',
      });
      console.log('❌ [DEBUG] Error toast displayed');
      
      return false;
    } finally {
      console.log('🔄 [DEBUG] Setting isDeleting to false');
      setIsDeleting(false);
    }
  };

  const closeDeleteDialog = () => {
    console.log('❌ [DEBUG] Closing delete dialog');
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
