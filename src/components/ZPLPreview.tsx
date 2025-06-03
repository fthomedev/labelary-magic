
import React from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Download, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { countLabels } from '@/components/preview/ZplLabelCounter';
import { PreviewHeader } from '@/components/preview/PreviewHeader';
import { ArchiveInfo } from '@/components/preview/ArchiveInfo';

interface ZPLPreviewProps {
  content: string;
  sourceType?: 'file' | 'zip';
  fileCount?: number;
  isProcessingComplete?: boolean;
  lastPdfUrl?: string;
  onDownload?: () => void;
}

export function ZPLPreview({ 
  content, 
  sourceType = 'file', 
  fileCount = 1,
  isProcessingComplete = false,
  lastPdfUrl,
  onDownload
}: ZPLPreviewProps) {
  const { t } = useTranslation();
  
  // Use the consistent counting function throughout the system
  const labelCount = countLabels(content);
  console.log(`📋 ZPLPreview: Displaying ${labelCount} labels for preview`);

  const truncatedContent = content.length > 500 ? content.substring(0, 500) + '...' : content;

  return (
    <div className="space-y-3">
      <PreviewHeader 
        sourceType={sourceType}
        fileCount={fileCount}
      />
      
      {sourceType === 'zip' && (
        <ArchiveInfo fileCount={fileCount} />
      )}
      
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <span className="font-medium text-green-900 text-sm">
            {t('totalLabels')}
          </span>
        </div>
        <div className="text-lg font-bold text-green-700">
          {labelCount} {t('labelsProcessed')}
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-700 border rounded-lg p-3">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-4 w-4 text-gray-600 dark:text-gray-300" />
          <span className="font-medium text-gray-900 dark:text-gray-100 text-sm">
            {t('zplPreview')}
          </span>
        </div>
        <pre className="text-xs bg-white dark:bg-gray-800 border rounded p-2 overflow-auto max-h-32 font-mono text-gray-700 dark:text-gray-300">
          {truncatedContent}
        </pre>
      </div>

      {isProcessingComplete && lastPdfUrl && onDownload && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-blue-900 text-sm mb-1">
                {t('processingComplete')}
              </div>
              <div className="text-blue-700 text-xs">
                {t('readyForDownload')}
              </div>
            </div>
            <Button
              onClick={onDownload}
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Download className="h-3 w-3 mr-1" />
              {t('download')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
