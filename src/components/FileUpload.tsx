import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { DropZone } from './upload/DropZone';
import { ErrorMessage } from './upload/ErrorMessage';
import { processMultipleFiles } from './upload/fileProcessors';

interface FileUploadProps {
  onFileSelect: (content: string, type?: 'file' | 'zip', count?: number) => void;
}

export function FileUpload({ onFileSelect }: FileUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { t } = useTranslation();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    
    if (acceptedFiles.length === 0) return;
    
    // Add new files to existing selection
    const newFiles = [...selectedFiles, ...acceptedFiles];
    setSelectedFiles(newFiles);
    
    // Process all files together
    processMultipleFiles(
      newFiles,
      onFileSelect,
      setError,
      setIsProcessing,
      t,
      true // showToast = true for new uploads
    );
  }, [selectedFiles, onFileSelect, t]);

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    
    if (newFiles.length === 0) {
      // Reset if no files left
      onFileSelect('', 'file', 0);
    } else {
      // Reprocess remaining files without showing toast
      processMultipleFiles(
        newFiles,
        onFileSelect,
        setError,
        setIsProcessing,
        t,
        false // showToast = false for file removal
      );
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/zip': ['.zip'],
      'application/x-zip-compressed': ['.zip'],
    },
    multiple: true, // Enable multiple file selection
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
            selectedFiles={selectedFiles}
            onRemoveFile={removeFile}
          />
        </div>
      </div>
      <ErrorMessage message={error} />
    </Card>
  );
}
