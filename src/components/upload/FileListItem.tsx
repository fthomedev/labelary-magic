import React from 'react';
import { FileText, Archive, Tag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';

export interface ProcessedFileInfo {
  file: File;
  labelCount: number;
  content: string;
}

interface FileListItemProps {
  fileInfo: ProcessedFileInfo;
  onRemove: () => void;
  index: number;
}

export function FileListItem({ fileInfo, onRemove, index }: FileListItemProps) {
  const { t } = useTranslation();
  const { file, labelCount } = fileInfo;
  const isZip = file.name.toLowerCase().endsWith('.zip');
  
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div 
      className="group flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border/50 hover:border-border hover:bg-muted/70 transition-all duration-200 animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* File Icon */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
          isZip ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-blue-100 dark:bg-blue-900/30'
        }`}>
          {isZip ? (
            <Archive className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          ) : (
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          )}
        </div>
        
        {/* File Info */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground truncate" title={file.name}>
            {file.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(file.size)}
          </p>
        </div>
        
        {/* Label Count Badge */}
        <Badge variant="secondary" className="flex-shrink-0 gap-1 bg-primary/10 text-primary border-0">
          <Tag className="h-3 w-3" />
          <span>{labelCount}</span>
        </Badge>
      </div>
      
      {/* Remove Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="flex-shrink-0 ml-2 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
        title={t('removeFile')}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
