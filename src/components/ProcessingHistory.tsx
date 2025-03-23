
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
    totalRecords,
    refreshData
  } = useProcessingHistory(localRecords, localOnly);

  if (isLoading) {
    return (
      <Card className="bg-white shadow-md border-border overflow-hidden">
        <CardHeader className="pb-1 pt-2 border-b">
          <CardTitle className="text-sm font-medium flex items-center gap-1">
            <History className="h-3.5 w-3.5 text-primary" />
            {t('processingHistory')}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-4 flex flex-col items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-primary mb-1" />
          <span className="text-xs text-muted-foreground">{t('loadingHistory')}</span>
        </CardContent>
      </Card>
    );
  }

  if (!records || records.length === 0) {
    return (
      <Card className="bg-white shadow-md border-border overflow-hidden">
        <CardHeader className="pb-1 pt-2 border-b">
          <CardTitle className="text-sm font-medium flex items-center gap-1">
            <History className="h-3.5 w-3.5 text-primary" />
            {t('processingHistory')}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-4 text-xs text-muted-foreground">
          {t('noHistory')}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white shadow-md border-border overflow-hidden">
      <CardHeader className="pb-1 pt-2 border-b">
        <CardTitle className="text-sm font-medium flex justify-between items-center">
          <div className="flex items-center gap-1">
            <History className="h-3.5 w-3.5 text-primary" />
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
        <CardFooter className="py-1 px-3 flex justify-center border-t">
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
