
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
  onDownload: (record: ProcessingRecord) => void;
  onDelete: (record: ProcessingRecord) => void;
  onShare: (record: ProcessingRecord) => void;
  isMobile: boolean;
}

export function HistoryTable({ 
  records, 
  formatDate, 
  onDownload,
  onDelete,
  onShare,
  isMobile 
}: HistoryTableProps) {
  const { t } = useTranslation();

  console.log('📋 [DEBUG] HistoryTable rendering with records:', records.length);

  return (
    <div className="overflow-x-auto max-h-[400px]">
      <Table className="compact-table">
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            <TableHead className="w-[40%] font-medium text-foreground py-1 text-xs">
              {isMobile ? t('date').substring(0, 4) : t('date')}
            </TableHead>
            <TableHead className="w-[30%] font-medium text-foreground py-1 text-xs">
              {isMobile ? t('labelCount').split(' ')[0] : t('labelCount')}
            </TableHead>
            <TableHead className="w-[30%] py-1"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => {
            console.log('📋 [DEBUG] Rendering table row for record:', record.id);
            return (
              <HistoryTableRow
                key={record.id}
                record={record}
                formatDate={formatDate}
                onDownload={onDownload}
                onDelete={onDelete}
                onShare={onShare}
              />
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
