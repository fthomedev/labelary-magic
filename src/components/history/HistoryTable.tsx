
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { HistoryTableRow } from './HistoryTableRow';
import { ProcessingRecord } from '@/hooks/useZplConversion';

interface HistoryTableProps {
  records: ProcessingRecord[];
  formatDate: (date: Date) => string;
  onDownload: (pdfUrl: string) => void;
  isMobile: boolean;
}

export function HistoryTable({ 
  records, 
  formatDate, 
  onDownload,
  isMobile 
}: HistoryTableProps) {
  const { t } = useTranslation();

  return (
    <div className="overflow-x-auto">
      <Table className="compact-table">
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-[40%] font-medium text-foreground py-1 text-[11px]">
              {isMobile ? t('date').substring(0, 4) : t('date')}
            </TableHead>
            <TableHead className="w-[40%] font-medium text-foreground py-1 text-[11px]">
              {isMobile ? t('labelCount').split(' ')[0] : t('labelCount')}
            </TableHead>
            <TableHead className="w-[20%] py-1"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <HistoryTableRow
              key={record.id}
              record={record}
              formatDate={formatDate}
              onDownload={onDownload}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
