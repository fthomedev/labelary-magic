
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { PreviewHeader } from './preview/PreviewHeader';
import { countLabels } from './preview/ZplLabelCounter';
import { FormatSelector, PrintFormat } from './format/FormatSelector';
import { LabelSizeSelector } from './format/LabelSizeSelector';
import { TwoColumnToggle } from './format/TwoColumnToggle';
import { LabelSize } from '@/types/labelSize';

interface ZPLPreviewProps {
  content: string;
  sourceType?: 'file' | 'zip';
  fileCount?: number;
  isProcessingComplete?: boolean;
  lastPdfUrl?: string;
  onDownload?: () => void;
  selectedFormat: PrintFormat;
  onFormatChange: (format: PrintFormat) => void;
  labelSize: LabelSize;
  onLabelSizeChange: (size: LabelSize) => void;
  twoColumn: boolean;
  onTwoColumnChange: (enabled: boolean) => void;
}

export function ZPLPreview({ 
  content, 
  sourceType = 'file', 
  fileCount = 1, 
  isProcessingComplete = false,
  lastPdfUrl,
  onDownload,
  selectedFormat,
  onFormatChange,
  labelSize,
  onLabelSizeChange,
  twoColumn,
  onTwoColumnChange,
}: ZPLPreviewProps) {
  const isMobile = useIsMobile();
  const totalLabels = countLabels(content);

  return (
    <div className="rounded-xl overflow-hidden gradient-border">
      <Card className="border-0 shadow-none bg-gradient-to-r from-white to-gray-50">
        <CardContent className="p-3 space-y-3">
          <div className={`flex flex-${isMobile ? 'col' : 'row'} items-${isMobile ? 'start' : 'center'} justify-between gap-3`}>
            <PreviewHeader 
              isProcessingComplete={isProcessingComplete} 
              totalLabels={totalLabels} 
            />
          </div>

          <div className="border-t pt-3">
            <FormatSelector 
              selectedFormat={selectedFormat}
              onFormatChange={onFormatChange}
            />
          </div>

          {selectedFormat === 'standard' && (
            <div className="border-t pt-3">
              <TwoColumnToggle enabled={twoColumn} onChange={onTwoColumnChange} />
            </div>
          )}

          <div className="border-t pt-3">
            <LabelSizeSelector
              value={labelSize}
              onChange={onLabelSizeChange}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
