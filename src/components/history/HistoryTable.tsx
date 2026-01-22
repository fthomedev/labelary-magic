
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
      <Table className="compact-table table-fixed w-full">
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            {showCheckbox && (
              <TableHead className="w-8 py-1 px-2">
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
            <TableHead className="font-medium text-foreground py-1 px-2 text-[11px] w-[85px]">
              {t('dateShort')}
            </TableHead>
            <TableHead className="font-medium text-foreground py-1 px-2 text-[11px] w-[50px]">
              {t('labelsShort')}
            </TableHead>
            <TableHead className="font-medium text-foreground py-1 px-2 text-[11px] w-[70px]">
              {t('typeShort')}
            </TableHead>
            <TableHead className="font-medium text-foreground py-1 px-2 text-[11px] w-[50px] hidden sm:table-cell">
              {t('timeShort')}
            </TableHead>
            <TableHead className="font-medium text-foreground py-1 px-2 text-[11px] w-[60px] hidden md:table-cell">
              {t('status')}
            </TableHead>
            <TableHead className="w-[70px] py-1 px-1"></TableHead>
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
