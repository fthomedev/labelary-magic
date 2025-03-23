
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
      <TableCell className="py-2 text-xs">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3 text-primary flex-shrink-0" />
          <span className="font-medium">{formatDate(record.date)}</span>
        </div>
      </TableCell>
      <TableCell className="py-2 text-xs">
        <div className="flex items-center gap-1">
          <Tag className="h-3 w-3 text-primary flex-shrink-0" />
          <span>{record.labelCount}</span>
        </div>
      </TableCell>
      <TableCell className="py-2">
        <div className="flex justify-end items-center">
          <Button
            variant="ghost"
            size="sm"
            className="p-0 h-7 w-7 rounded-full flex items-center justify-center text-primary hover:text-primary-foreground hover:bg-primary hover-lift"
            onClick={() => onDownload(record.pdfUrl)}
            title={t('download')}
          >
            <Download className="h-3 w-3" />
            <span className="sr-only">{t('download')}</span>
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
