
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Tag, Archive, CheckCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ZPLPreviewProps {
  content: string;
  sourceType?: 'file' | 'zip';
  fileCount?: number;
  isProcessingComplete?: boolean;
  lastPdfUrl?: string;
}

export function ZPLPreview({ 
  content, 
  sourceType = 'file', 
  fileCount = 1, 
  isProcessingComplete = false,
  lastPdfUrl
}: ZPLPreviewProps) {
  const { t } = useTranslation();
  
  const countLabels = (zplContent: string): number => {
    // Count by looking only for "^XA" markers in the ZPL content
    const regex = /\^XA/g;
    const matches = zplContent.match(regex);
    const xaCount = matches ? matches.length : 0;
    // Divide by 2 and round up
    return Math.ceil(xaCount / 2);
  };

  const totalLabels = countLabels(content);

  const handleDownload = () => {
    if (lastPdfUrl) {
      const a = document.createElement('a');
      a.href = lastPdfUrl;
      a.download = 'etiquetas.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(lastPdfUrl);
      document.body.removeChild(a);
    }
  };

  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
            <Tag className="h-4 w-4 text-green-700" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-green-900">
              {t('totalLabels')}
            </h3>
            <p className="text-xs text-green-700">
              {isProcessingComplete ? t('processingComplete') : t('processing')}
            </p>
          </div>
        </div>
        
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-lg font-semibold text-green-600 shadow-sm">
          {totalLabels}
        </span>
      </div>
      
      {sourceType === 'zip' && fileCount > 1 && (
        <div className="mt-2 flex items-center p-2 bg-blue-50 rounded-lg border border-blue-100 text-xs">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 mr-2">
            <Archive className="h-3 w-3 text-blue-500" />
          </div>
          <div>
            <p className="text-xs text-blue-700">
              {t('filesProcessedFromZip', { count: fileCount })}
            </p>
          </div>
        </div>
      )}
      
      {isProcessingComplete && lastPdfUrl && (
        <div className="mt-2 flex justify-center">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full flex items-center justify-center gap-1 text-green-700 border-green-200 bg-white hover:bg-green-50 hover:border-green-300 text-xs py-1 px-3"
            onClick={handleDownload}
          >
            <Download className="h-3.5 w-3.5" />
            {t('downloadAgain')}
          </Button>
        </div>
      )}
    </div>
  );
}
