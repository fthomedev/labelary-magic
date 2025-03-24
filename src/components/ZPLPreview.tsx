
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
        <CardContent className="p-3">
          <div className="flex flex-row items-center justify-between gap-3 mb-2">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                {isProcessingComplete ? (
                  <CheckCircle className="h-4 w-4 text-primary" />
                ) : (
                  <Tag className="h-4 w-4 text-primary" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground font-heading">
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
                className="flex items-center gap-1 text-primary border-primary/20 hover:bg-primary/5 hover:border-primary text-xs py-1 px-3 h-auto"
                onClick={handleDownload}
                disabled={!lastPdfUrl}
              >
                <Download className="h-3 w-3" />
                {t('downloadAgain')}
              </Button>
            ) : (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1">
                <span className="text-lg font-semibold text-primary">
                  {totalLabels}
                </span>
              </span>
            )}
          </div>
          
          {sourceType === 'zip' && fileCount > 1 && (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
