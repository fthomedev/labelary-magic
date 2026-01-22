
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Tag, Clock, Download, Eye, Trash2, Zap, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ProcessingRecord } from '@/hooks/useZplConversion';

interface HistoryCardProps {
  record: ProcessingRecord;
  formatDate: (date: Date) => string;
  onDownload: (record: ProcessingRecord) => void;
  onDelete: (record: ProcessingRecord) => void;
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
}

export function HistoryCard({
  record,
  formatDate,
  onDownload,
  onDelete,
  isSelected,
  onSelect,
}: HistoryCardProps) {
  const { t } = useTranslation();
  const isBlobUrl = record.pdfUrl && record.pdfUrl.startsWith('blob:');
  const hasStoragePath = !!record.pdfPath;
  const hasValidUrl = !isBlobUrl || record.pdfUrl.startsWith('http');
  const isAvailable = hasStoragePath || hasValidUrl;
  
  const isHD = record.processingType === 'a4';
  const processingTimeSeconds = record.processingTime ? (record.processingTime / 1000).toFixed(1) : null;

  return (
    <div className="flex flex-col gap-3 p-3 border rounded-lg bg-card hover:bg-accent/30 transition-colors">
      {/* Header with checkbox and date */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(record.id, checked as boolean)}
          />
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(record.date)}</span>
          </div>
        </div>
        
        {/* Status badge */}
        {isAvailable ? (
          <Badge variant="outline" className="text-[10px] h-5 gap-1 bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800">
            <CheckCircle2 className="h-2.5 w-2.5" />
            {t('historyStatus.ready')}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-[10px] h-5 gap-1 bg-muted text-muted-foreground">
            <AlertCircle className="h-2.5 w-2.5" />
            {t('historyStatus.unavailable')}
          </Badge>
        )}
      </div>

      {/* Info row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Tag className="h-3.5 w-3.5 text-primary" />
          <span className="text-sm font-medium">{record.labelCount} {t('labels')}</span>
        </div>
        
        {processingTimeSeconds && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{processingTimeSeconds}s</span>
          </div>
        )}
        
        {/* Type badge */}
        {isHD ? (
          <Badge variant="secondary" className="text-[10px] h-5 gap-1 bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400">
            <Sparkles className="h-2.5 w-2.5" />
            {t('conversionType.hd')}
          </Badge>
        ) : (
          <Badge variant="secondary" className="text-[10px] h-5 gap-1 bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400">
            <Zap className="h-2.5 w-2.5" />
            {t('conversionType.standard')}
          </Badge>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1 border-t">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 h-8 text-xs gap-1.5"
          onClick={() => onDownload(record)}
          disabled={!isAvailable}
        >
          <Eye className="h-3.5 w-3.5" />
          {t('view')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(record)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
