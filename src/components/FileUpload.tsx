import React, { useCallback, useState, forwardRef, useImperativeHandle } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';
import { DropZone } from './upload/DropZone';
import { ErrorMessage } from './upload/ErrorMessage';
import { FilesSummary } from './upload/FilesSummary';
import { FileTray } from './upload/FileTray';
import { processSingleFile, ProcessedFileResult } from './upload/fileProcessors';
import { ProcessedFileInfo } from './upload/FileListItem';
import { toast } from '@/hooks/use-toast';

interface FileUploadProps {
  onFileSelect: (content: string, type?: 'file' | 'zip', count?: number) => void;
}

export interface FileUploadRef {
  openFileSelector: () => void;
  clearFiles: () => void;
}

export const FileUpload = forwardRef<FileUploadRef, FileUploadProps>(({ onFileSelect }, ref) => {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedFiles, setProcessedFiles] = useState<ProcessedFileInfo[]>([]);
  const [isTrayOpen, setIsTrayOpen] = useState(false);
  const { t } = useTranslation();

  // Process files and extract label counts
  const processFiles = useCallback(async (files: File[], showToast: boolean = true) => {
    setIsProcessing(true);
    setError(null);
    
    try {
      const results: ProcessedFileInfo[] = [];
      
      for (const file of files) {
        const result = await processSingleFile(file, t);
        if (result) {
          results.push({
            file,
            labelCount: result.labelCount,
            content: result.content,
          });
        }
      }
      
      if (results.length === 0) {
        setError(t('noValidZplContent'));
        toast({
          variant: "destructive",
          title: t('error'),
          description: t('noValidZplContent'),
          duration: 4000,
        });
        return;
      }
      
      // Combine with existing files
      const newProcessedFiles = [...processedFiles, ...results];
      setProcessedFiles(newProcessedFiles);
      
      // Combine all content and notify parent
      const combinedContent = newProcessedFiles.map(f => f.content).join('\n');
      const totalLabels = newProcessedFiles.reduce((sum, f) => sum + f.labelCount, 0);
      const hasZip = newProcessedFiles.some(f => f.file.name.toLowerCase().endsWith('.zip'));
      
      onFileSelect(combinedContent, hasZip ? 'zip' : 'file', totalLabels);
      
      if (showToast) {
        toast({
          title: t('filesProcessed'),
          description: t('multipleFilesExtracted', { 
            fileCount: newProcessedFiles.length, 
            labelCount: totalLabels 
          }),
          duration: 3000,
        });
      }
    } catch (err) {
      console.error('Error processing files:', err);
      setError(t('errorProcessingFiles'));
      toast({
        variant: "destructive",
        title: t('error'),
        description: t('errorProcessingFiles'),
        duration: 4000,
      });
    } finally {
      setIsProcessing(false);
    }
  }, [processedFiles, onFileSelect, t]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    if (acceptedFiles.length === 0) return;
    processFiles(acceptedFiles, true);
  }, [processFiles]);

  const removeFile = useCallback((index: number) => {
    const newFiles = processedFiles.filter((_, i) => i !== index);
    setProcessedFiles(newFiles);
    
    if (newFiles.length === 0) {
      onFileSelect('', 'file', 0);
    } else {
      const combinedContent = newFiles.map(f => f.content).join('\n');
      const totalLabels = newFiles.reduce((sum, f) => sum + f.labelCount, 0);
      const hasZip = newFiles.some(f => f.file.name.toLowerCase().endsWith('.zip'));
      onFileSelect(combinedContent, hasZip ? 'zip' : 'file', totalLabels);
    }
  }, [processedFiles, onFileSelect]);

  const clearAllFiles = useCallback(() => {
    setProcessedFiles([]);
    setError(null);
    onFileSelect('', 'file', 0);
  }, [onFileSelect]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'application/zip': ['.zip'],
      'application/x-zip-compressed': ['.zip'],
    },
    multiple: true,
    noClick: false,
    noKeyboard: false,
  });

  // Expose functions to parent components
  useImperativeHandle(ref, () => ({
    openFileSelector: open,
    clearFiles: clearAllFiles
  }));

  const totalLabels = processedFiles.reduce((sum, f) => sum + f.labelCount, 0);
  const hasFiles = processedFiles.length > 0;

  return (
    <div className="w-full space-y-3">
      {/* Drop Zone Card */}
      <Card className="shadow-md overflow-hidden">
        <div
          {...getRootProps()}
          className={`p-6 border-2 border-dashed border-border rounded-xl hover:border-primary/50 hover:bg-primary/5 transition-colors duration-300 ${
            isDragActive ? 'border-primary bg-primary/10' : ''
          } ${hasFiles ? 'py-4' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="text-center">
            <DropZone 
              isDragActive={isDragActive}
              isProcessing={isProcessing}
            />
          </div>
        </div>
        <ErrorMessage message={error} />
      </Card>

      {/* Files Summary - Always visible when files exist */}
      {hasFiles && !isProcessing && (
        <FilesSummary
          fileCount={processedFiles.length}
          labelCount={totalLabels}
          isExpanded={isTrayOpen}
          onToggle={() => setIsTrayOpen(!isTrayOpen)}
          isProcessing={isProcessing}
        />
      )}

      {/* File Tray Sheet */}
      <FileTray
        isOpen={isTrayOpen}
        onClose={() => setIsTrayOpen(false)}
        files={processedFiles}
        onRemoveFile={removeFile}
        onClearAll={clearAllFiles}
        onAddMore={() => {
          setIsTrayOpen(false);
          open();
        }}
      />
    </div>
  );
});

FileUpload.displayName = 'FileUpload';
