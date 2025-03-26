
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { DropZone } from './upload/DropZone';
import { ErrorMessage } from './upload/ErrorMessage';
import { processZipFile, processTextFile } from './upload/fileProcessors';

interface FileUploadProps {
  onFileSelect: (content: string, type?: 'file' | 'zip', count?: number) => void;
}

export function FileUpload({ onFileSelect }: FileUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { t } = useTranslation();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    const file = acceptedFiles[0];
    
    if (!file) return;
    
    if (file.name.toLowerCase().endsWith('.zip')) {
      processZipFile(
        file,
        onFileSelect,
        setError,
        setIsProcessing,
        t
      );
    } else {
      processTextFile(
        file,
        onFileSelect,
        setError,
        t
      );
    }
  }, [onFileSelect, t]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/zip': ['.zip'],
      'application/x-zip-compressed': ['.zip'],
    },
    maxFiles: 1,
  });

  return (
    <Card className="w-full shadow-md overflow-hidden">
      <div
        {...getRootProps()}
        className={`p-6 border-2 border-dashed border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-colors duration-300 ${
          isDragActive ? 'border-primary bg-primary/10' : ''
        }`}
      >
        <input {...getInputProps()} />
        <div className="text-center">
          <DropZone 
            isDragActive={isDragActive}
            isProcessing={isProcessing}
            getInputProps={getInputProps}
            getRootProps={getRootProps}
          />
        </div>
      </div>
      <ErrorMessage message={error} />
    </Card>
  );
}
