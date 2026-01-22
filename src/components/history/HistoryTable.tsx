
import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { HistoryTableRow } from './HistoryTableRow';
import { ProcessingRecord } from '@/hooks/useZplConversion';

interface HistoryTableProps {
  records: ProcessingRecord[];
  formatDate: (date: Date) => string;
  onDownload: (record: ProcessingRecord) => void;
  onDelete: (record: ProcessingRecord) => void;
  isMobile: boolean;
  selectedIds?: Set<string>;
  onSelectRecord?: (id: string, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  showCheckbox?: boolean;
}

export function HistoryTable({ 
  records, 
  formatDate, 
  onDownload,
  onDelete,
  isMobile,
  selectedIds = new Set(),
  onSelectRecord,
  onSelectAll,
  showCheckbox = false,
}: HistoryTableProps) {
  const { t } = useTranslation();
  
  const allSelected = records.length > 0 && records.every(r => selectedIds.has(r.id));
  const someSelected = records.some(r => selectedIds.has(r.id)) && !allSelected;

  return (
    <div className="overflow-x-auto max-h-[500px]">
      <Table className="compact-table">
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            {showCheckbox && (
              <TableHead className="w-8 py-1">
                <Checkbox
                  checked={allSelected}
                  ref={(ref) => {
                    if (ref) {
                      (ref as any).indeterminate = someSelected;
                    }
                  }}
                  onCheckedChange={(checked) => onSelectAll?.(checked as boolean)}
                />
              </TableHead>
            )}
            <TableHead className="font-medium text-foreground py-1 text-xs">
              {isMobile ? t('date').substring(0, 4) : t('date')}
            </TableHead>
            <TableHead className="font-medium text-foreground py-1 text-xs">
              {isMobile ? t('labelCount').split(' ')[0] : t('labelCount')}
            </TableHead>
            <TableHead className="font-medium text-foreground py-1 text-xs">
              {t('printFormat')}
            </TableHead>
            <TableHead className="font-medium text-foreground py-1 text-xs hidden sm:table-cell">
              {t('processing')}
            </TableHead>
            <TableHead className="font-medium text-foreground py-1 text-xs hidden md:table-cell">
              {t('status')}
            </TableHead>
            <TableHead className="w-[80px] py-1"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {records.map((record) => (
            <HistoryTableRow
              key={record.id}
              record={record}
              formatDate={formatDate}
              onDownload={onDownload}
              onDelete={onDelete}
              isSelected={selectedIds.has(record.id)}
              onSelect={onSelectRecord}
              showCheckbox={showCheckbox}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
