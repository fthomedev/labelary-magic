
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
    <div className="rounded-xl overflow-hidden gradient-border">
      <Card className="border-0 shadow-none bg-gradient-to-r from-white to-gray-50">
        <CardContent className="px-3 py-2">
          <div className="flex flex-row items-center justify-between gap-2 mb-1">
            <div className="flex items-center space-x-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10">
                {isProcessingComplete ? (
                  <CheckCircle className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <Tag className="h-3.5 w-3.5 text-primary" />
                )}
              </div>
              <div>
                <h3 className="text-xs font-medium text-foreground font-heading">
                  {isProcessingComplete ? t('processingComplete') : t('totalLabels')}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isProcessingComplete ? t('labelsProcessed', { count: totalLabels }) : t('processing')}
                </p>
              </div>
            </div>
            {isProcessingComplete ? (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1 text-primary border-primary/20 hover:bg-primary/5 hover:border-primary text-xs py-1 px-2 h-auto"
                onClick={handleDownload}
                disabled={!lastPdfUrl}
              >
                <Download className="h-3 w-3" />
                {t('downloadAgain')}
              </Button>
            ) : (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5">
                <span className="text-base font-semibold text-primary">
                  {totalLabels}
                </span>
              </span>
            )}
          </div>
          
          {sourceType === 'zip' && fileCount > 1 && (
            <div className="flex items-center p-1.5 bg-blue-50 rounded-lg border border-blue-100 text-xs mt-1">
              <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 mr-1.5">
                <Archive className="h-2.5 w-2.5 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-blue-700">
                  {t('filesProcessedFromZip', { count: fileCount })}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
