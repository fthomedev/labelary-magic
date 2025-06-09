
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Calendar, Tag, AlertCircle, Trash2 } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ProcessingRecord } from '@/hooks/useZplConversion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface HistoryTableRowProps {
  record: ProcessingRecord;
  formatDate: (date: Date) => string;
  onDownload: (record: ProcessingRecord) => void;
  onDelete: (record: ProcessingRecord) => void;
}

export function HistoryTableRow({ 
  record, 
  formatDate, 
  onDownload,
  onDelete
}: HistoryTableRowProps) {
  const { t } = useTranslation();
  const isBlobUrl = record.pdfUrl && record.pdfUrl.startsWith('blob:');
  const hasStoragePath = !!record.pdfPath;
  const hasValidUrl = !isBlobUrl || record.pdfUrl.startsWith('http');

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
        <div className="flex justify-end items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`p-0 h-7 w-7 rounded-full flex items-center justify-center ${
                    hasStoragePath || hasValidUrl 
                      ? "text-primary hover:text-primary-foreground hover:bg-primary hover-lift" 
                      : "text-muted-foreground"
                  }`}
                  onClick={() => onDownload(record)}
                  disabled={isBlobUrl && !hasStoragePath && !hasValidUrl}
                  title={t('view')}
                >
                  {isBlobUrl && !hasStoragePath && !hasValidUrl ? (
                    <AlertCircle className="h-3 w-3" />
                  ) : (
                    <Download className="h-3 w-3" />
                  )}
                  <span className="sr-only">{t('view')}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {isBlobUrl && !hasStoragePath && !hasValidUrl
                  ? t('downloadUnavailableAfterRefresh') 
                  : t('view')}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-0 h-7 w-7 rounded-full flex items-center justify-center text-destructive hover:text-destructive-foreground hover:bg-destructive hover-lift"
                  onClick={() => onDelete(record)}
                  title={t('delete')}
                >
                  <Trash2 className="h-3 w-3" />
                  <span className="sr-only">{t('delete')}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {t('delete')}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </TableCell>
    </TableRow>
  );
}
