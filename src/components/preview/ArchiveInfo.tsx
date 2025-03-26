
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Archive } from 'lucide-react';

interface ArchiveInfoProps {
  sourceType: 'file' | 'zip';
  fileCount: number;
}

export function ArchiveInfo({ sourceType, fileCount }: ArchiveInfoProps) {
  const { t } = useTranslation();
  
  if (sourceType !== 'zip' || fileCount <= 1) {
    return null;
  }
  
  return (
    <div className="flex items-center p-2 bg-blue-50 rounded-lg border border-blue-100 text-xs">
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 mr-2">
        <Archive className="h-3 w-3 text-blue-500" />
      </div>
      <div>
        <p className="text-xs text-blue-700">
          {t('filesProcessedFromZip', { count: fileCount })}
        </p>
      </div>
    </div>
  );
}
