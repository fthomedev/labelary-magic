
import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Archive, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface DropZoneProps {
  isDragActive: boolean;
  isProcessing: boolean;
  getInputProps: () => any;
  getRootProps: () => any;
  selectedFiles?: File[];
  onRemoveFile?: (index: number) => void;
}

export function DropZone({ 
  isDragActive, 
  isProcessing, 
  getInputProps, 
  getRootProps,
  selectedFiles = [],
  onRemoveFile
}: DropZoneProps) {
  const { t } = useTranslation();
  
  if (isProcessing) {
    return (
      <div className="py-8">
        <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-sm font-medium text-foreground">{t('processingFiles')}</p>
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

  // Show selected files if any
  if (selectedFiles.length > 0) {
    return (
      <div className="py-6">
        <div className="flex justify-center space-x-4 mb-4">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
            <FileText className="h-6 w-6 text-green-600" />
          </div>
        </div>
        <p className="text-base font-medium text-foreground mb-4">
          {t('filesSelected', { count: selectedFiles.length })}
        </p>
        
        <div className="space-y-2 mb-4 max-h-32 overflow-y-auto">
          {selectedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-2 text-sm">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="truncate max-w-[200px]">{file.name}</span>
                <span className="text-gray-400">({(file.size / 1024).toFixed(1)} KB)</span>
              </div>
              {onRemoveFile && (
                <button
                  onClick={() => onRemoveFile(index)}
                  className="text-red-500 hover:text-red-700 p-1"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        
        <Button 
          variant="outline" 
          size="sm" 
          className="text-sm bg-white hover:bg-primary/5 hover:text-primary hover-lift btn-effect"
        >
          <Upload className="mr-2 h-4 w-4" />
          {t('selectMoreFiles')}
        </Button>
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
        {t('dragAndDropMultiple')}
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
        {t('selectFiles')}
      </Button>
    </>
  );
}
