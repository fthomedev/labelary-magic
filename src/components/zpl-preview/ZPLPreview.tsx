
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { CheckCircle, Printer } from 'lucide-react';
import { ZPLInfoTooltip } from './ZPLInfoTooltip';
import { ProcessButton } from './ProcessButton';
import { DownloadButton } from './DownloadButton';
import { ProgressIndicator } from './ProgressIndicator';
import { ZipFileInfo } from './ZipFileInfo';

interface ZPLPreviewProps {
  content: string;
  sourceType?: 'file' | 'zip';
  fileCount?: number;
  isProcessingComplete?: boolean;
  lastPdfUrl?: string;
  isConverting?: boolean;
  progress?: number;
  onConvert?: () => void;
}

export function ZPLPreview({ 
  content, 
  sourceType = 'file', 
  fileCount = 1, 
  isProcessingComplete = false,
  lastPdfUrl,
  isConverting = false,
  progress = 0,
  onConvert = () => {}
}: ZPLPreviewProps) {
  const { t } = useTranslation();
  const [labelCount, setLabelCount] = useState<number>(0);
  
  useEffect(() => {
    if (content) {
      // Count number of labels in the ZPL content based on ^XA and ^XZ pairs
      const countLabels = (zplContent: string): number => {
        const regex = /\^XA[\s\S]*?\^XZ/g;
        const matches = zplContent.match(regex);
        return matches ? matches.length : 0;
      };
      
      setLabelCount(countLabels(content));
    }
  }, [content]);

  return (
    <div className="rounded-lg bg-gradient-to-r from-blue-500/10 to-cyan-500/10 p-1.5">
      <Card className="border-0 shadow-sm">
        <div className="p-5">
          <div className="flex flex-col space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 dark:from-blue-600/30 dark:to-cyan-600/30">
                  {isProcessingComplete ? (
                    <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-500" aria-hidden="true" />
                  ) : (
                    <Printer className="h-6 w-6 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  )}
                </div>
                
                {/* Process button above the Total Labels text */}
                {!isProcessingComplete && (
                  <ProcessButton 
                    isConverting={isConverting} 
                    progress={progress} 
                    onConvert={onConvert} 
                  />
                )}
              </div>
              
              <div className="flex items-center">
                <div className="flex flex-col sm:flex-row items-start sm:items-center">
                  <div className="flex items-center">
                    <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mr-2 font-heading">
                      {isProcessingComplete ? t('processingComplete') : t('totalLabels')}
                    </h3>
                    <ZPLInfoTooltip />
                    <p className="text-sm text-gray-700 dark:text-gray-300 ml-2">
                      {isProcessingComplete ? t('labelsProcessed', { count: labelCount }) : `${labelCount}`}
                    </p>
                  </div>
                  
                  {isProcessingComplete && (
                    <div className="mt-2 sm:mt-0 sm:ml-4">
                      <DownloadButton lastPdfUrl={lastPdfUrl} />
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <ZipFileInfo sourceType={sourceType} fileCount={fileCount} />
            
            <ProgressIndicator progress={progress} isConverting={isConverting} />
          </div>
        </div>
      </Card>
    </div>
  );
}
