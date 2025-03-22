
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Tag, Archive, CheckCircle, Download, Printer } from 'lucide-react';
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
    const regex = /\^XA.*?\^XZ/gs;
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
    <div className="rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 p-1.5">
      <Card className="border-0 shadow-sm">
        <div className="p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <div className="flex items-center space-x-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 dark:from-blue-600/30 dark:to-cyan-600/30">
                {isProcessingComplete ? (
                  <CheckCircle className="h-6 w-6 text-green-500 dark:text-green-400" />
                ) : (
                  <Printer className="h-6 w-6 text-blue-500 dark:text-blue-400" />
                )}
              </div>
              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">
                  {isProcessingComplete ? t('processingComplete') : t('totalLabels')}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isProcessingComplete ? t('labelsProcessed', { count: totalLabels }) : t('processing')}
                </p>
              </div>
            </div>
            {isProcessingComplete ? (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2 text-green-600 border-green-200 hover:bg-green-50 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/30 w-full sm:w-auto justify-center font-medium"
                onClick={handleDownload}
                disabled={!lastPdfUrl}
              >
                <Download className="h-4 w-4" />
                {t('downloadAgain')}
              </Button>
            ) : (
              <div className="inline-flex items-center justify-center rounded-md bg-gradient-to-r from-blue-500/10 to-cyan-500/10 px-5 py-2.5 w-full sm:w-auto">
                <span className="text-xl font-semibold text-blue-700 dark:text-blue-400">
                  {totalLabels}
                </span>
              </div>
            )}
          </div>
          
          {sourceType === 'zip' && fileCount > 1 && (
            <div className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-100 dark:border-blue-800/40">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 dark:bg-blue-800/30 mr-3">
                <Archive className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  {t('filesProcessedFromZip', { count: fileCount })}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
