
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Tag } from 'lucide-react';

interface ZPLPreviewProps {
  content: string;
}

export function ZPLPreview({ content }: ZPLPreviewProps) {
  const { t } = useTranslation();
  
  const countLabels = (zplContent: string): number => {
    const regex = /~DGR:DEMO\.GRF/g;
    const matches = zplContent.match(regex);
    return matches ? matches.length : 0;
  };

  const totalLabels = countLabels(content);

  return (
    <div className="rounded-lg bg-gradient-to-r from-cyan-500/10 to-blue-500/10 p-1">
      <div className="rounded-md bg-white dark:bg-gray-800 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 dark:bg-cyan-900/30">
              <Tag className="h-6 w-6 text-cyan-500 dark:text-cyan-400" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {t('totalLabels')}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('processing')}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center rounded-md bg-cyan-50 dark:bg-cyan-900/50 px-4 py-2">
            <span className="text-xl font-semibold text-cyan-700 dark:text-cyan-400">
              {totalLabels}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}
