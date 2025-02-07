
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';

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
    <Card className="w-full max-w-2xl mx-auto mt-6">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">
            {t('totalLabels')}:
          </h3>
          <span className="text-lg font-bold">
            {totalLabels}
          </span>
        </div>
      </div>
    </Card>
  );
}
