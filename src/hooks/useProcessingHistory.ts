
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ProcessingRecord } from '@/hooks/useZplConversion';
import { useHistoryData } from '@/hooks/history/useHistoryData';
import { useDateFormatter } from '@/hooks/history/useDateFormatter';
import { useHistoryDownload } from '@/hooks/history/useHistoryDownload';
import { useHistoryDelete } from '@/hooks/history/useHistoryDelete';
import { useHistoryDiagnostics } from '@/hooks/history/useHistoryDiagnostics';
import { usePagination } from '@/hooks/history/usePagination';
import { useHistoryPrint } from '@/hooks/history/useHistoryPrint';

export function useProcessingHistory(localRecords?: ProcessingRecord[], localOnly = false) {
  const { t } = useTranslation();
  const { formatDate, isMobile } = useDateFormatter();
  const { 
    handleDownload, 
    isModalOpen, 
    currentPdfUrl, 
    closePdfModal,
    downloadCurrentPdf
  } = useHistoryDownload();
  
  const { handlePrint } = useHistoryPrint();
  
  const {
    isDeleting,
    deleteDialogOpen,
    recordToDelete,
    handleDeleteClick,
    handleDeleteConfirm,
    closeDeleteDialog,
  } = useHistoryDelete();
  
  const { diagnoseRecord } = useHistoryDiagnostics();
  
  const pagination = usePagination(0, 8);
  const { 
    currentPage, 
    handlePageChange, 
    recordsPerPage,
    totalPages
  } = pagination;
  
  const { 
    isLoading, 
    records, 
    totalRecords, 
    refreshData 
  } = useHistoryData(localRecords, localOnly, currentPage, recordsPerPage);

  const handleDeleteWithRefresh = useCallback(async (): Promise<boolean> => {
    console.log('handleDeleteWithRefresh called');
    
    // Run diagnostics before deletion
    if (recordToDelete) {
      await diagnoseRecord(recordToDelete.id);
    }
    
    const success = await handleDeleteConfirm();
    console.log('Delete operation success:', success);
    
    if (success) {
      console.log('Refreshing data after successful deletion');
      await refreshData();
    }
    
    return success;
  }, [handleDeleteConfirm, refreshData, recordToDelete, diagnoseRecord]);

  return {
    isLoading,
    records,
    formatDate,
    handleDownload,
    handlePrint,
    isMobile,
    currentPage,
    totalPages: Math.ceil(totalRecords / recordsPerPage),
    handlePageChange,
    totalRecords,
    refreshData,
    // PDF modal state and handlers
    isModalOpen,
    currentPdfUrl,
    closePdfModal,
    downloadCurrentPdf,
    // Delete functionality
    isDeleting,
    deleteDialogOpen,
    recordToDelete,
    handleDeleteClick,
    handleDeleteConfirm: handleDeleteWithRefresh,
    closeDeleteDialog,
  };
}
