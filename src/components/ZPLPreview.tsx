
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
    // Count by looking for label start markers in the ZPL content
    const regex = /\^XA/g;
    const matches = zplContent.match(regex);
    return matches ? matches.length : 0;
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
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                {isProcessingComplete ? (
                  <CheckCircle className="h-6 w-6 text-primary" />
                ) : (
                  <Tag className="h-6 w-6 text-primary" />
                )}
              </div>
              <div>
                <h3 className="text-base font-medium text-foreground font-heading">
                  {isProcessingComplete ? t('processingComplete') : t('totalLabels')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isProcessingComplete ? t('labelsProcessed', { count: totalLabels }) : t('processing')}
                </p>
              </div>
            </div>
            {isProcessingComplete ? (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2 text-primary border-primary/20 hover:bg-primary/5 hover:border-primary w-full sm:w-auto justify-center hover-lift btn-effect"
                onClick={handleDownload}
                disabled={!lastPdfUrl}
              >
                <Download className="h-4 w-4" />
                {t('downloadAgain')}
              </Button>
            ) : (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-2 w-full sm:w-auto justify-center">
                <span className="text-xl font-semibold text-primary">
                  {totalLabels}
                </span>
              </span>
            )}
          </div>
          
          {sourceType === 'zip' && fileCount > 1 && (
            <div className="flex items-center p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 mr-3">
                <Archive className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-blue-700">
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
