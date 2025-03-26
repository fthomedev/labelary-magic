
import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface DropZoneProps {
  isDragActive: boolean;
  isProcessing: boolean;
  getInputProps: () => any;
  getRootProps: () => any;
}

export function DropZone({ 
  isDragActive, 
  isProcessing, 
  getInputProps, 
  getRootProps 
}: DropZoneProps) {
  const { t } = useTranslation();
  
  if (isProcessing) {
    return (
      <div className="py-8">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-sm font-medium text-foreground">{t('processingZip')}</p>
      </div>
    );
  }
  
  if (isDragActive) {
    return (
      <div className="py-10 flex flex-col items-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
          <Upload className="h-6 w-6 text-primary" />
        </div>
        <p className="text-base font-medium text-foreground">{t('dropHere')}</p>
      </div>
    );
  }
  
  return (
    <>
      <div className="flex justify-center space-x-4 mb-5">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Upload className="h-6 w-6 text-primary" />
        </div>
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Archive className="h-6 w-6 text-primary" />
        </div>
      </div>
      <p className="text-base font-medium text-foreground mb-2">
        {t('dragAndDrop')}
      </p>
      <p className="text-sm text-muted-foreground mb-4">
        {t('acceptedFormats')}
      </p>
      <Button 
        variant="outline" 
        size="sm" 
        className="text-sm bg-white hover:bg-primary/5 hover:text-primary hover-lift btn-effect"
      >
        <FileText className="mr-2 h-4 w-4" />
        {t('selectFile')}
      </Button>
    </>
  );
}
