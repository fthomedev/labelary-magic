
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
    <TableRow key={record.id} className="hover:bg-accent/30 transition-colors">
      <TableCell className="py-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary flex-shrink-0" />
          <span className="font-medium">{formatDate(record.date)}</span>
        </div>
      </TableCell>
      <TableCell className="py-3">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-primary flex-shrink-0" />
          <span>{record.labelCount}</span>
        </div>
      </TableCell>
      <TableCell className="py-3">
        <div className="flex justify-end items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-9 w-9 rounded-full flex items-center justify-center text-primary hover:text-primary-foreground hover:bg-primary hover-lift"
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
