
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Download, FileText, AlertCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProcessingRecord } from '@/hooks/useZplConversion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface HistoryListItemProps {
  record: ProcessingRecord;
  formatTime: string;
  onDownload: (record: ProcessingRecord) => void;
  onDelete: (record: ProcessingRecord) => void;
}

export function HistoryListItem({ 
  record, 
  formatTime,
  onDownload,
  onDelete
}: HistoryListItemProps) {
  const { t } = useTranslation();
  const isBlobUrl = record.pdfUrl && record.pdfUrl.startsWith('blob:');
  const hasStoragePath = !!record.pdfPath;
  const hasValidUrl = !isBlobUrl || record.pdfUrl.startsWith('http');
  const canDownload = hasStoragePath || hasValidUrl;

  return (
    <div className="flex items-center justify-between py-2 px-3 hover:bg-accent/30 transition-colors rounded-md group">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <FileText className="h-4 w-4 text-primary flex-shrink-0" />
        <div className="flex items-center gap-2 text-sm min-w-0">
          <span className="font-medium text-foreground">
            {record.labelCount} {t('labels')}
          </span>
          <span className="text-muted-foreground">•</span>
          <span className="text-muted-foreground">{formatTime}</span>
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className={`p-0 h-7 w-7 rounded-full flex items-center justify-center ${
                  canDownload 
                    ? "text-primary hover:text-primary-foreground hover:bg-primary" 
                    : "text-muted-foreground"
                }`}
                onClick={() => onDownload(record)}
                disabled={!canDownload}
              >
                {!canDownload ? (
                  <AlertCircle className="h-3.5 w-3.5" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {!canDownload ? t('downloadUnavailableAfterRefresh') : t('download')}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-7 w-7 rounded-full flex items-center justify-center text-rose-300 hover:text-destructive-foreground hover:bg-destructive transition-colors"
                onClick={() => onDelete(record)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {t('delete')}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
