
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, History } from 'lucide-react';
import { CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { ProcessingRecord } from '@/hooks/useZplConversion';
import { useProcessingHistory } from '@/hooks/useProcessingHistory';
import { HistoryTable } from './history/HistoryTable';
import { HistoryPagination } from './history/HistoryPagination';
import { PdfViewerModal } from './history/PdfViewerModal';

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
    downloadCurrentPdf
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
          isMobile={isMobile}
        />
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

      {/* PDF Viewer Modal */}
      <PdfViewerModal
        pdfUrl={currentPdfUrl}
        isOpen={isModalOpen}
        onClose={closePdfModal}
        onDownload={downloadCurrentPdf}
      />
    </>
  );
}
