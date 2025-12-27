
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, History, Heart } from 'lucide-react';
import qrCodePix from '@/assets/qrcode-pix.png';
import { CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { ProcessingRecord } from '@/hooks/useZplConversion';
import { useProcessingHistory } from '@/hooks/useProcessingHistory';
import { HistoryTable } from './history/HistoryTable';
import { HistoryPagination } from './history/HistoryPagination';
import { PdfViewerModal } from './history/PdfViewerModal';
import { DeleteConfirmDialog } from './history/DeleteConfirmDialog';
import { DonationButton } from './DonationButton';


interface ProcessingHistoryProps {
  records?: ProcessingRecord[];
  localOnly?: boolean;
}

export function ProcessingHistory({ records: localRecords, localOnly = false }: ProcessingHistoryProps) {
  const { t } = useTranslation();
  const {
    isLoading,
    records,
    formatDate,
    handleDownload,
    isMobile,
    currentPage,
    totalPages,
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
    handleDeleteConfirm,
    closeDeleteDialog,
  } = useProcessingHistory(localRecords, localOnly);

  if (isLoading) {
    return (
      <>
        <CardHeader className="pb-1 pt-3 border-b">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            {t('processingHistory')}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6 flex flex-col items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
          <span className="text-sm text-muted-foreground">{t('loadingHistory')}</span>
        </CardContent>
      </>
    );
  }

  if (!records || records.length === 0) {
    return (
      <>
        <CardHeader className="pb-1 pt-3 border-b">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            {t('processingHistory')}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6 text-sm text-muted-foreground">
          {t('noHistory')}
        </CardContent>
      </>
    );
  }

  return (
    <>
      <CardHeader className="pb-1 pt-3 border-b">
        <CardTitle className="text-base font-medium flex justify-between items-center">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            <span>{t('processingHistory')}</span>
          </div>
          {!localOnly && totalRecords > 0 && (
            <span className="text-xs font-normal text-muted-foreground">
              {t('totalRecords', { count: totalRecords })}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <HistoryTable
          records={records}
          formatDate={formatDate}
          onDownload={handleDownload}
          onDelete={handleDeleteClick}
          isMobile={isMobile}
        />
        {!localOnly && (
          <p className="text-[10px] text-muted-foreground/70 px-4 py-2 italic">
            {t('historyRetentionNote')}
          </p>
        )}
      </CardContent>
      {!localOnly && totalPages > 1 && (
        <CardFooter className="py-2 px-4 flex justify-center border-t">
          <HistoryPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </CardFooter>
      )}

      {/* Donation Call-to-Action */}
      {!localOnly && records && records.length > 0 && (
        <div className="border-t bg-gradient-to-r from-emerald-50/50 to-green-50/50 dark:from-emerald-950/20 dark:to-green-950/20 p-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="flex-shrink-0 relative">
              <img 
                src={qrCodePix} 
                alt="QR Code PIX para doação" 
                className="w-24 h-24 rounded-lg border-2 border-emerald-200 dark:border-emerald-800 shadow-md"
              />
              {/* Badge PIX */}
              <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                PIX
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <div className="space-y-0.5">
                <p className="text-sm font-semibold flex items-center justify-center sm:justify-start gap-1.5">
                  <Heart className="h-4 w-4 text-emerald-500 fill-emerald-500" />
                  {t('donationCta.title')}
                </p>
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  {t('donationCta.subtitle')}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('donationCta.message')}
              </p>
              <DonationButton 
                variant="link" 
                className="h-auto p-0 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
              >
                {t('donationCta.otherMethods')}
              </DonationButton>
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      <PdfViewerModal
        pdfUrl={currentPdfUrl}
        isOpen={isModalOpen}
        onClose={closePdfModal}
        onDownload={downloadCurrentPdf}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={closeDeleteDialog}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </>
  );
}
