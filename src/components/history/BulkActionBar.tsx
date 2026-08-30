
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface BulkActionBarProps {
  selectedCount: number;
  isAllHistorySelected?: boolean;
  onDownloadSelected: () => void;
  onDeleteSelected: () => void;
  onClearSelection: () => void;
  isDownloading?: boolean;
  isDeleting?: boolean;
  hideDownload?: boolean;
  /** Total records in history (all pages). */
  totalRecords?: number;
  /** True when the current page is fully selected but more records exist. */
  canSelectAllHistory?: boolean;
  onSelectAllHistory?: () => void;
}

export function BulkActionBar({
  selectedCount,
  isAllHistorySelected = false,
  onDownloadSelected,
  onDeleteSelected,
  onClearSelection,
  isDownloading = false,
  isDeleting = false,
  hideDownload = false,
  totalRecords = 0,
  canSelectAllHistory = false,
  onSelectAllHistory,
}: BulkActionBarProps) {
  const { t } = useTranslation();

  return (
    <AnimatePresence initial={false}>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.15 }}
          className="overflow-hidden border-b bg-primary/5"
        >
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-3 py-2 sm:px-4">
            <span className="text-xs font-medium text-foreground">
              {isAllHistorySelected
                ? t('bulkActions.allHistorySelected', { count: selectedCount })
                : t('bulkActions.selected', { count: selectedCount })}
            </span>

            {!isAllHistorySelected && canSelectAllHistory && (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs font-semibold"
                onClick={() => onSelectAllHistory?.()}
              >
                {t('bulkActions.selectAllHistory', { count: totalRecords })}
              </Button>
            )}

            <div className="ml-auto flex items-center gap-1">
              {!hideDownload && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-2 text-xs gap-1.5"
                  onClick={onDownloadSelected}
                  disabled={isDownloading || isAllHistorySelected}
                >
                  <Download className="h-3.5 w-3.5" />
                  {t('bulkActions.downloadSelected')}
                </Button>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={onDeleteSelected}
                disabled={isDeleting}
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t('bulkActions.deleteSelected')}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={onClearSelection}
                aria-label={t('bulkActions.clearSelection')}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
