import React from 'react';
import { Files, Tag, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

interface FilesSummaryProps {
  fileCount: number;
  labelCount: number;
  isExpanded: boolean;
  onToggle: () => void;
  isProcessing?: boolean;
}

export function FilesSummary({ 
  fileCount, 
  labelCount, 
  isExpanded, 
  onToggle,
  isProcessing = false
}: FilesSummaryProps) {
  const { t } = useTranslation();
  
  if (fileCount === 0) return null;

  return (
    <div 
      className="flex items-center justify-between p-3 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20 cursor-pointer hover:border-primary/40 transition-all duration-200"
      onClick={onToggle}
    >
      <div className="flex items-center gap-4">
        {/* Status Icon */}
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
        </div>
        
        {/* Stats */}
        <div className="flex items-center gap-3">
          {/* File Count */}
          <div className="flex items-center gap-1.5">
            <Files className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              {fileCount} {fileCount === 1 ? t('file') : t('files')}
            </span>
          </div>
          
          <span className="text-muted-foreground">•</span>
          
          {/* Label Count */}
          <div className="flex items-center gap-1.5">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">
              {labelCount} {labelCount === 1 ? t('label') : t('labels')}
            </span>
          </div>
        </div>
        
        {/* Status Badge */}
        {!isProcessing && (
          <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
            {t('readyToProcess')}
          </Badge>
        )}
      </div>
      
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        className="gap-1 text-muted-foreground hover:text-foreground"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
      >
        {isExpanded ? (
          <>
            {t('hideDetails')}
            <ChevronUp className="h-4 w-4" />
          </>
        ) : (
          <>
            {t('viewDetails')}
            <ChevronDown className="h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  );
}
