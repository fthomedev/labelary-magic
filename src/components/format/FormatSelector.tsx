
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Grid3X3 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type PrintFormat = 'standard' | 'a4';

interface FormatSelectorProps {
  selectedFormat: PrintFormat;
  onFormatChange: (format: PrintFormat) => void;
  onConfirm: () => void;
}

export function FormatSelector({ selectedFormat, onFormatChange, onConfirm }: FormatSelectorProps) {
  const { t } = useTranslation();

  return (
    <Card className="w-full shadow-md">
      <CardContent className="p-6">
        <div className="text-center mb-6">
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {t('printFormat')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('selectPrintFormat')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              selectedFormat === 'standard'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => onFormatChange('standard')}
          >
            <div className="flex flex-col items-center text-center">
              <FileText className="h-8 w-8 text-primary mb-3" />
              <h4 className="font-medium text-foreground mb-2">
                {t('standardFormat')}
              </h4>
              <p className="text-sm text-muted-foreground">
                {t('standardFormatDescription')}
              </p>
            </div>
          </div>

          <div
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              selectedFormat === 'a4'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
            onClick={() => onFormatChange('a4')}
          >
            <div className="flex flex-col items-center text-center">
              <Grid3X3 className="h-8 w-8 text-primary mb-3" />
              <h4 className="font-medium text-foreground mb-2">
                {t('a4Format')}
              </h4>
              <p className="text-sm text-muted-foreground">
                {t('a4FormatDescription')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <Button onClick={onConfirm} className="px-8">
            {t('confirm')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
