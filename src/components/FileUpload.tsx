import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import JSZip from 'jszip';

interface FileUploadProps {
  onFileSelect: (content: string, type?: 'file' | 'zip', count?: number) => void;
  onNewFileSelected?: () => void;
}

export function FileUpload({ onFileSelect, onNewFileSelected }: FileUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();

  const processZipFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const zip = new JSZip();
      const zipContents = await zip.loadAsync(file);
      
      const zplFiles = Object.keys(zipContents.files).filter(
        filename => filename.endsWith('.txt') || filename.endsWith('.zpl')
      );
      
      if (zplFiles.length === 0) {
        throw new Error(t('noZplFilesInZip'));
      }
      
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
      onFileSelect(allContent, 'zip', fileContents.length);
      
      toast({
        title: t('zipProcessed'),
        description: t('zipFilesExtracted', { count: fileContents.length }),
        duration: 3000,
      });
    } catch (error) {
      console.error('Error processing ZIP file:', error);
      setError(error instanceof Error ? error.message : t('zipProcessingError'));
      toast({
        variant: "destructive",
        title: t('error'),
        description: error instanceof Error ? error.message : t('zipProcessingError'),
        duration: 4000,
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
        onFileSelect(content, 'file', 1);
        toast({
          title: t('fileUploaded'),
          description: t('fileProcessed', { fileName: file.name }),
          duration: 3000,
        });
      } else {
        setError(t('noValidZplContent'));
        toast({
          variant: "destructive",
          title: t('error'),
          description: t('noValidZplContent'),
          duration: 4000,
        });
      }
    };
    reader.onerror = () => {
      setError(t('readError'));
      toast({
        variant: "destructive",
        title: t('error'),
        description: t('readErrorMessage'),
        duration: 4000,
      });
    };
    reader.readAsText(file);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError(null);
    const file = acceptedFiles[0];
    
    if (!file) return;
    
    if (onNewFileSelected) {
      onNewFileSelected();
    }
    
    if (file.name.toLowerCase().endsWith('.zip')) {
      processZipFile(file);
    } else {
      processTextFile(file);
    }
  }, [onNewFileSelected]);

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
          {isProcessing ? (
            <div className="py-8">
              <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-sm font-medium text-foreground">{t('processingZip')}</p>
            </div>
          ) : isDragActive ? (
            <div className="py-10 flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <p className="text-base font-medium text-foreground">{t('dropHere')}</p>
            </div>
          ) : (
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
          )}
        </div>
      </div>
      {error && (
        <div className="mt-2 p-3 bg-destructive/10 rounded-lg text-sm flex items-center text-destructive">
          <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
          {error}
        </div>
      )}
    </Card>
  );
}
