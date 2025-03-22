
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Archive } from 'lucide-react';

interface ZipFileInfoProps {
  fileCount: number;
  sourceType: 'file' | 'zip';
}

export const ZipFileInfo: React.FC<ZipFileInfoProps> = ({ 
  fileCount, 
  sourceType 
}) => {
  const { t } = useTranslation();

  if (sourceType !== 'zip' || fileCount <= 1) return null;

  return (
    <div 
      className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-100 dark:border-blue-800/40"
      aria-label={t('filesProcessedFromZip', { count: fileCount })}
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 dark:bg-blue-800/30 mr-3">
        <Archive className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
      </div>
      <div>
        <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
          {t('filesProcessedFromZip', { count: fileCount })}
        </p>
      </div>
    </div>
  );
};
