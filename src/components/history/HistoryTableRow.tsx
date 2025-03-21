
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Calendar, Tag } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ProcessingRecord } from '@/hooks/useZplConversion';

interface HistoryTableRowProps {
  record: ProcessingRecord;
  formatDate: (date: Date) => string;
  onDownload: (pdfUrl: string) => void;
}

export function HistoryTableRow({ 
  record, 
  formatDate, 
  onDownload
}: HistoryTableRowProps) {
  const { t } = useTranslation();

  return (
    <TableRow key={record.id}>
      <TableCell className="py-2">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
          <span>{formatDate(record.date)}</span>
        </div>
      </TableCell>
      <TableCell className="py-2">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-cyan-500 flex-shrink-0" />
          <span>{record.labelCount}</span>
        </div>
      </TableCell>
      <TableCell className="py-2">
        <div className="flex justify-end items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-8 w-8 rounded-full flex items-center justify-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            onClick={() => onDownload(record.pdfUrl)}
            title={t('download')}
          >
            <Download className="h-4 w-4" />
            <span className="sr-only">{t('download')}</span>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
