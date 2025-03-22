
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Tag, Archive, CheckCircle, Download, Printer, Play, Loader2, Info, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

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
  onConvert
}: ZPLPreviewProps) {
  const { t } = useTranslation();
  
  const countLabels = (zplContent: string): number => {
    const regex = /\^XA[\s\S]*?\^XZ/g;
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

  const downloadSampleZpl = () => {
    // Sample ZPL content with two label formats
    const sampleZpl = `^XA
^FO50,50^A0N,50,50^FDSample Label 1^FS
^FO50,120^BY3^BCN,100,Y,N,N^FD123456789012^FS
^FO50,250^A0N,30,30^FDTest Product^FS
^XZ
^XA
^FO50,50^A0N,50,50^FDSample Label 2^FS
^FO50,120^BY3^BCN,100,Y,N,N^FD987654321098^FS
^FO50,250^A0N,30,30^FDAnother Product^FS
^XZ`;
    
    const blob = new Blob([sampleZpl], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample.zpl';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

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
                
                {/* Repositioned Process button - Now placed here, above the Total Labels text */}
                {!isProcessingComplete && (
                  <Button
                    size="lg"
                    onClick={onConvert}
                    disabled={isConverting}
                    className={`transition-all duration-200 active:scale-95 ${
                      isConverting 
                        ? 'bg-gray-100 text-gray-500 dark:bg-gray-700'
                        : progress === 0
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600'
                        : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
                    }`}
                  >
                    {isConverting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('converting')}
                      </>
                    ) : progress === 0 ? (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        {t('process')}
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        {t('downloadComplete')}
                      </>
                    )}
                  </Button>
                )}
              </div>
              
              <div className="flex items-center">
                <div className="flex flex-col sm:flex-row items-start sm:items-center">
                  <div className="flex items-center">
                    <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mr-2 font-heading">
                      {isProcessingComplete ? t('processingComplete') : t('totalLabels')}
                    </h3>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="inline-flex cursor-help">
                            <Info className="h-4 w-4 text-blue-500" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs" side="right">
                          <p className="text-sm">
                            ZPL (Zebra Programming Language) é uma linguagem utilizada para definir formatação de etiquetas em impressoras térmicas.
                          </p>
                          <Button 
                            variant="link" 
                            className="p-0 h-auto text-xs text-blue-500 hover:text-blue-700 transition-colors duration-200" 
                            onClick={downloadSampleZpl}
                          >
                            <FileDown className="h-3 w-3 mr-1" />
                            Baixar arquivo ZPL de exemplo
                          </Button>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <p className="text-sm text-gray-700 dark:text-gray-300 ml-2">
                      {isProcessingComplete ? t('labelsProcessed', { count: totalLabels }) : t('processing')}
                    </p>
                  </div>
                  
                  {isProcessingComplete && (
                    <div className="mt-2 sm:mt-0 sm:ml-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex items-center gap-2 text-green-700 border-green-200 hover:bg-green-50 hover:text-green-800 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/30 dark:hover:text-green-300 w-full sm:w-auto justify-center font-medium active:scale-95 transition-transform duration-100"
                        onClick={handleDownload}
                        disabled={!lastPdfUrl}
                        aria-label={t('downloadAgain')}
                      >
                        <Download className="h-4 w-4" aria-hidden="true" />
                        {t('downloadAgain')}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {sourceType === 'zip' && fileCount > 1 && (
              <div 
                className="flex items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-100 dark:border-blue-800/40"
                aria-label={t('filesProcessedFromZip', { count: fileCount })}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 dark:bg-blue-800/30 mr-3">
                  <Archive className="h-5 w-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    {t('filesProcessedFromZip', { count: fileCount })}
                  </p>
                </div>
              </div>
            )}
            
            {isConverting && (
              <div className="space-y-2 mt-4">
                <div className="overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                  <Progress value={progress} className="h-2 w-full bg-gradient-to-r from-cyan-500 to-blue-500" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  {t('processing')} {Math.round(progress)}%
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
