
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
import { Button } from '@/components/ui/button';
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
  totalRecords?: number;
  isAllHistorySelected?: boolean;
  onSelectAllHistory?: () => void;
  onClearSelection?: () => void;
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
  totalRecords = 0,
  isAllHistorySelected = false,
  onSelectAllHistory,
  onClearSelection,
}: HistoryTableProps) {
  const { t } = useTranslation();

  const allSelected = records.length > 0 && records.every(r => selectedIds.has(r.id));
  const someSelected = records.some(r => selectedIds.has(r.id)) && !allSelected;
  const hasMoreRecords = totalRecords > records.length;
  const showBanner = showCheckbox && allSelected && hasMoreRecords;

  return (
    <div className="overflow-x-auto max-h-[500px]">
      {showBanner && (
        <div className="flex flex-wrap items-center justify-center gap-2 bg-primary/5 border-b border-primary/20 px-4 py-2 text-xs text-foreground">
          {isAllHistorySelected ? (
            <>
              <span>{t('bulkActions.allHistorySelected', { count: totalRecords })}</span>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={() => onClearSelection?.()}
              >
                {t('bulkActions.clearSelection')}
              </Button>
            </>
          ) : (
            <>
              <span>{t('bulkActions.pageSelectedPrompt', { pageCount: records.length })}</span>
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs font-semibold"
                onClick={() => onSelectAllHistory?.()}
              >
                {t('bulkActions.selectAllHistory', { count: totalRecords })}
              </Button>
            </>
          )}
        </div>
      )}
      <Table className="compact-table">
        <TableHeader>
          <TableRow className="bg-muted/50 hover:bg-muted/50">
            {showCheckbox && (
              <TableHead className="w-8 py-1">
                <Checkbox
                  variant="header"
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
            <TableHead className="font-medium text-foreground py-1 text-xs whitespace-nowrap">
              {t('historyTable.date')}
            </TableHead>
            <TableHead className="font-medium text-foreground py-1 text-xs whitespace-nowrap">
              {t('historyTable.labels')}
            </TableHead>
            <TableHead className="font-medium text-foreground py-1 text-xs whitespace-nowrap">
              {t('historyTable.format')}
            </TableHead>
            <TableHead className="font-medium text-foreground py-1 text-xs whitespace-nowrap hidden sm:table-cell">
              {t('historyTable.time')}
            </TableHead>
            <TableHead className="font-medium text-foreground py-1 text-xs whitespace-nowrap hidden md:table-cell">
              {t('historyTable.status')}
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

