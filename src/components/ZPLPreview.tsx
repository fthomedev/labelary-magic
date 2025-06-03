
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useIsMobile } from '@/hooks/use-mobile';
import { PreviewHeader } from './preview/PreviewHeader';
import { ArchiveInfo } from './preview/ArchiveInfo';
import { countLabels } from './preview/ZplLabelCounter';
import { FormatSelector, PrintFormat } from './format/FormatSelector';

interface ZPLPreviewProps {
  content: string;
  sourceType?: 'file' | 'zip';
  fileCount?: number;
  isProcessingComplete?: boolean;
  lastPdfUrl?: string;
  onDownload?: () => void;
  selectedFormat: PrintFormat;
  onFormatChange: (format: PrintFormat) => void;
}

export function ZPLPreview({ 
  content, 
  sourceType = 'file', 
  fileCount = 1, 
  isProcessingComplete = false,
  lastPdfUrl,
  onDownload,
  selectedFormat,
  onFormatChange
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
          
          <ArchiveInfo 
            sourceType={sourceType} 
            fileCount={fileCount} 
          />

          <div className="border-t pt-3">
            <FormatSelector 
              selectedFormat={selectedFormat}
              onFormatChange={onFormatChange}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
