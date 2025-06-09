
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ProcessingRecord } from '@/hooks/useZplConversion';
import { useHistoryData } from '@/hooks/history/useHistoryData';
import { useDateFormatter } from '@/hooks/history/useDateFormatter';
import { useHistoryDownload } from '@/hooks/history/useHistoryDownload';
import { useHistoryDelete } from '@/hooks/history/useHistoryDelete';
import { usePagination } from '@/hooks/history/usePagination';

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
  
  const {
    isDeleting,
    deleteDialogOpen,
    recordToDelete,
    handleDeleteClick,
    handleDeleteConfirm,
    closeDeleteDialog,
  } = useHistoryDelete();
  
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

  const handleDeleteWithRefresh = useCallback(async () => {
    const success = await handleDeleteConfirm();
    if (success) {
      // Refresh the data after successful deletion
      refreshData();
    }
  }, [handleDeleteConfirm, refreshData]);

  return {
    isLoading,
    records,
    formatDate,
    handleDownload,
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
