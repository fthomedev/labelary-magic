
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Calendar, Tag, AlertCircle, Trash2, Share2, Printer } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ProcessingRecord } from '@/hooks/useZplConversion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface HistoryTableRowProps {
  record: ProcessingRecord;
  formatDate: (date: Date) => string;
  onDownload: (record: ProcessingRecord) => void;
  onDelete: (record: ProcessingRecord) => void;
  onShare: (record: ProcessingRecord) => void;
  onPrint: (record: ProcessingRecord) => void;
}

export function HistoryTableRow({ 
  record, 
  formatDate, 
  onDownload,
  onDelete,
  onShare,
  onPrint
}: HistoryTableRowProps) {
  const { t } = useTranslation();
  const isBlobUrl = record.pdfUrl && record.pdfUrl.startsWith('blob:');
  const hasStoragePath = !!record.pdfPath;
  const hasValidUrl = !isBlobUrl || record.pdfUrl.startsWith('http');
  const canShare = hasStoragePath || hasValidUrl;
  const canPrint = hasStoragePath || hasValidUrl;

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
                    canPrint 
                      ? "text-purple-600 hover:text-purple-foreground hover:bg-purple-600 hover-lift" 
                      : "text-muted-foreground"
                  }`}
                  onClick={() => onPrint(record)}
                  disabled={!canPrint}
                  title={t('print')}
                >
                  <Printer className="h-3 w-3" />
                  <span className="sr-only">{t('print')}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {canPrint ? t('print') : t('printUnavailableAfterRefresh')}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

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
                  className={`p-0 h-7 w-7 rounded-full flex items-center justify-center ${
                    canShare 
                      ? "text-blue-600 hover:text-blue-foreground hover:bg-blue-600 hover-lift" 
                      : "text-muted-foreground"
                  }`}
                  onClick={() => onShare(record)}
                  disabled={!canShare}
                  title="Compartilhar"
                >
                  <Share2 className="h-3 w-3" />
                  <span className="sr-only">Compartilhar</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {canShare ? "Compartilhar" : "Compartilhamento indisponível"}
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
