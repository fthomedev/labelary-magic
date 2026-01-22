
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Calendar, Tag, AlertCircle, Trash2, Eye, Clock, Zap, Sparkles, CheckCircle2 } from 'lucide-react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ProcessingRecord } from '@/hooks/useZplConversion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface HistoryTableRowProps {
  record: ProcessingRecord;
  formatDate: (date: Date) => string;
  onDownload: (record: ProcessingRecord) => void;
  onDelete: (record: ProcessingRecord) => void;
  isSelected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  showCheckbox?: boolean;
}

export function HistoryTableRow({ 
  record, 
  formatDate, 
  onDownload,
  onDelete,
  isSelected = false,
  onSelect,
  showCheckbox = false,
}: HistoryTableRowProps) {
  const { t } = useTranslation();
  const isBlobUrl = record.pdfUrl && record.pdfUrl.startsWith('blob:');
  const hasStoragePath = !!record.pdfPath;
  const hasValidUrl = !isBlobUrl || record.pdfUrl.startsWith('http');
  const isAvailable = hasStoragePath || hasValidUrl;
  
  const isHD = record.processingType === 'a4';
  const processingTimeSeconds = record.processingTime ? (record.processingTime / 1000).toFixed(1) : null;

  return (
    <TableRow className={`hover:bg-accent/30 transition-colors ${isSelected ? 'bg-accent/40' : ''}`}>
      {/* Checkbox column */}
      {showCheckbox && (
        <TableCell className="py-1.5 px-2 w-8">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect?.(record.id, checked as boolean)}
          />
        </TableCell>
      )}
      
      {/* Date column */}
      <TableCell className="py-1.5 px-2 text-[11px]">
        <div className="flex items-center gap-1">
          <Calendar className="h-3 w-3 text-primary flex-shrink-0" />
          <span className="font-medium whitespace-nowrap">{formatDate(record.date)}</span>
        </div>
      </TableCell>
      
      {/* Labels column */}
      <TableCell className="py-1.5 px-2 text-[11px]">
        <div className="flex items-center gap-1">
          <Tag className="h-3 w-3 text-primary flex-shrink-0" />
          <span>{record.labelCount}</span>
        </div>
      </TableCell>
      
      {/* Type column */}
      <TableCell className="py-1.5 px-2 text-[11px]">
        {isHD ? (
          <Badge variant="secondary" className="text-[9px] h-4 gap-0.5 bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400 px-1">
            <Sparkles className="h-2 w-2" />
            HD
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-[9px] h-4 gap-0.5 bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 px-1">
            <Zap className="h-2 w-2" />
            Std
          </Badge>
        )}
      </TableCell>
      
      {/* Time column */}
      <TableCell className="py-1.5 px-2 text-[11px] hidden sm:table-cell">
        {processingTimeSeconds && (
          <div className="flex items-center gap-0.5 text-muted-foreground">
            <Clock className="h-2.5 w-2.5" />
            <span>{processingTimeSeconds}s</span>
          </div>
        )}
      </TableCell>
      
      {/* Status column */}
      <TableCell className="py-1.5 px-2 text-[11px] hidden md:table-cell">
        {isAvailable ? (
          <Badge variant="outline" className="text-[9px] h-4 gap-0.5 bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800 px-1">
            <CheckCircle2 className="h-2 w-2" />
            OK
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[9px] h-4 gap-0.5 bg-muted text-muted-foreground px-1">
            <AlertCircle className="h-2 w-2" />
            N/A
          </Badge>
        )}
      </TableCell>
      
      {/* Actions column */}
      <TableCell className="py-1.5 px-1">
        <div className="flex justify-end items-center gap-0.5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`p-0 h-6 w-6 rounded-full flex items-center justify-center ${
                    isAvailable
                      ? "text-primary hover:text-primary-foreground hover:bg-primary hover-lift" 
                      : "text-muted-foreground"
                  }`}
                  onClick={() => onDownload(record)}
                  disabled={!isAvailable}
                  title={t('view')}
                >
                  {isAvailable ? (
                    <Eye className="h-3 w-3" />
                  ) : (
                    <AlertCircle className="h-3 w-3" />
                  )}
                  <span className="sr-only">{t('view')}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                {!isAvailable
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
                  className="p-0 h-6 w-6 rounded-full flex items-center justify-center text-destructive hover:text-destructive-foreground hover:bg-destructive hover-lift"
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
