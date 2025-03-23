
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
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
    pagination
  } = useProcessingHistory(localRecords, localOnly);

  if (isLoading) {
    return (
      <Card className="mt-4 bg-white dark:bg-gray-800 shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">
            {t('processingHistory')}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 flex flex-col items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary mb-2" />
          <span className="text-gray-500 dark:text-gray-400">{t('loadingHistory')}</span>
        </CardContent>
      </Card>
    );
  }

  if (!records || records.length === 0) {
    return (
      <Card className="mt-4 bg-white dark:bg-gray-800 shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-medium">
            {t('processingHistory')}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8 text-gray-500 dark:text-gray-400">
          {t('noHistory')}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-4 bg-white dark:bg-gray-800 shadow overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">
          {t('processingHistory')}
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
      {!localOnly && pagination.totalPages > 1 && (
        <CardFooter className="py-2 px-4 border-t">
          <HistoryPagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            onPageChange={pagination.handlePageChange}
            isMobile={isMobile}
          />
        </CardFooter>
      )}
    </Card>
  );
}
