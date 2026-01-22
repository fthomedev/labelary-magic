
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface BulkActionBarProps {
  selectedCount: number;
  onDownloadSelected: () => void;
  onDeleteSelected: () => void;
  onClearSelection: () => void;
  isDownloading?: boolean;
  isDeleting?: boolean;
}

export function BulkActionBar({
  selectedCount,
  onDownloadSelected,
  onDeleteSelected,
  onClearSelection,
  isDownloading = false,
  isDeleting = false,
}: BulkActionBarProps) {
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50"
        >
          <div className="flex items-center gap-2 bg-background/95 backdrop-blur-sm border shadow-lg rounded-full px-4 py-2">
            <span className="text-sm font-medium text-foreground">
              {t('bulkActions.selected', { count: selectedCount })}
            </span>
            
            <div className="h-4 w-px bg-border mx-1" />
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs gap-1.5"
              onClick={onDownloadSelected}
              disabled={isDownloading}
            >
              <Download className="h-3.5 w-3.5" />
              {t('bulkActions.downloadSelected')}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={onDeleteSelected}
              disabled={isDeleting}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t('bulkActions.deleteSelected')}
            </Button>
            
            <div className="h-4 w-px bg-border mx-1" />
            
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onClearSelection}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
