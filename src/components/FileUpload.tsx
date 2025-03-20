
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';
import JSZip from 'jszip';
import { splitZPLIntoBlocks } from '@/utils/pdfUtils';

interface FileUploadProps {
  onFileSelect: (content: string, type?: 'file' | 'zip', count?: number) => void;
}

export function FileUpload({ onFileSelect }: FileUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const processZipFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const zip = new JSZip();
      const zipContents = await zip.loadAsync(file);
      
      // Filter for .txt or .zpl files
      const zplFiles = Object.keys(zipContents.files).filter(
        filename => filename.endsWith('.txt') || filename.endsWith('.zpl')
      );
      
      if (zplFiles.length === 0) {
        throw new Error(t('noZplFilesInZip'));
      }
      
      // Process all ZPL files and concatenate their content
      const fileContents: string[] = [];
      for (const filename of zplFiles) {
        const content = await zipContents.files[filename].async('text');
        if (content.includes('^XA') && content.includes('^XZ')) {
          fileContents.push(content);
        }
      }
      
      if (fileContents.length === 0) {
        throw new Error(t('noValidZplContent'));
      }
      
      const allContent = fileContents.join('\n');
      
      // Count the actual number of labels in the content
      const labelCount = splitZPLIntoBlocks(allContent).length;
      console.log(`ZIP file contains ${labelCount} labels across ${fileContents.length} files`);
      
      onFileSelect(allContent, 'zip', fileContents.length);
      
      toast({
        title: t('zipProcessed'),
        description: t('zipFilesExtracted', { count: fileContents.length }),
      });
    } catch (error) {
      console.error('Error processing ZIP file:', error);
      setError(error instanceof Error ? error.message : t('zipProcessingError'));
      toast({
        variant: "destructive",
        title: t('error'),
        description: error instanceof Error ? error.message : t('zipProcessingError'),
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const processTextFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content.includes('^XA') && content.includes('^XZ')) {
        // Count the actual number of labels in the content
        const labelCount = splitZPLIntoBlocks(content).length;
        console.log(`Text file contains ${labelCount} labels`);
        
        onFileSelect(content);
        toast({
          title: t('fileUploaded'),
          description: t('fileProcessed', { fileName: file.name }),
        });
      } else {
        setError(t('noValidZplContent'));
        toast({
          variant: "destructive",
          title: t('error'),
          description: t('noValidZplContent'),
        });
      }
    };
    reader.onerror = () => {
      setError(t('readError'));
      toast({
        variant: "destructive",
        title: t('error'),
        description: t('readErrorMessage'),
      });
    };
    reader.readAsText(file);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    const file = acceptedFiles[0];
    
    if (!file) return;
    
    if (file.name.toLowerCase().endsWith('.zip')) {
      processZipFile(file);
    } else {
      processTextFile(file);
    }
  }, [onFileSelect, toast, t]);

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
    <Card className="w-full">
      <div
        {...getRootProps()}
        className="p-4 border-2 border-dashed border-border rounded-lg hover:border-primary/50 transition-colors"
      >
        <input {...getInputProps()} />
        <div className="text-center">
          {isProcessing ? (
            <div className="py-6">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-sm font-medium">{t('processingZip')}</p>
            </div>
          ) : isDragActive ? (
            <p className="text-sm sm:text-base font-medium py-6">{t('dropHere')}</p>
          ) : (
            <>
              <div className="flex justify-center space-x-4 mb-4">
                <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
                <Archive className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
              </div>
              <p className="text-sm sm:text-base font-medium mb-2">
                {t('dragAndDrop')}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                {t('acceptedFormats')}: .txt, .zip
              </p>
              <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                <FileText className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                {t('selectFile')}
              </Button>
            </>
          )}
        </div>
      </div>
      {error && (
        <div className="mt-2 p-2 bg-destructive/10 rounded text-xs sm:text-sm flex items-center text-destructive">
          <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          {error}
        </div>
      )}
    </Card>
  );
}
