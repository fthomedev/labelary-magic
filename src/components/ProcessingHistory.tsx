
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, History } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { ProcessingRecord } from '@/hooks/useZplConversion';
import { useProcessingHistory } from '@/hooks/useProcessingHistory';
import { HistoryTable } from './history/HistoryTable';
import { HistoryPagination } from './history/HistoryPagination';

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
    totalRecords
  } = useProcessingHistory(localRecords, localOnly);

  if (isLoading) {
    return (
      <Card className="mt-6 bg-white shadow-md border-border overflow-hidden">
        <CardHeader className="pb-2 border-b">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            {t('processingHistory')}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-10 flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
          <span className="text-muted-foreground">{t('loadingHistory')}</span>
        </CardContent>
      </Card>
    );
  }

  if (!records || records.length === 0) {
    return (
      <Card className="mt-6 bg-white shadow-md border-border overflow-hidden">
        <CardHeader className="pb-2 border-b">
          <CardTitle className="text-lg font-medium flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            {t('processingHistory')}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-10 text-muted-foreground">
          {t('noHistory')}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6 bg-white shadow-md border-border overflow-hidden">
      <CardHeader className="pb-2 border-b">
        <CardTitle className="text-lg font-medium flex justify-between items-center">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <span>{t('processingHistory')}</span>
          </div>
          {!localOnly && (
            <span className="text-sm font-normal text-muted-foreground">
              {t('totalRecords')}: {totalRecords}
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
        <CardFooter className="py-4 px-6 flex justify-center border-t">
          <HistoryPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </CardFooter>
      )}
    </Card>
  );
}
