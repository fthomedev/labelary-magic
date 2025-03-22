
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, Archive, ArrowDownCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';
import JSZip from 'jszip';

interface FileUploadProps {
  onFileSelect: (content: string) => void;
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
      onFileSelect(allContent);
      
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
    <Card className="w-full overflow-hidden">
      <div
        {...getRootProps()}
        className={`file-drop-area p-8 flex flex-col items-center justify-center border-2 border-dashed rounded-lg transition-all duration-200 ${
          isDragActive ? 'dragging border-primary bg-primary/5' : 'border-gray-300 hover:border-primary/70 dark:border-gray-600 dark:hover:border-primary/70'
        }`}
      >
        <input {...getInputProps()} />
        <div className="text-center">
          {isProcessing ? (
            <div className="py-8">
              <div className="animate-spin w-10 h-10 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-base font-medium">{t('processingZip')}</p>
            </div>
          ) : isDragActive ? (
            <div className="py-10">
              <ArrowDownCircle className="h-12 w-12 text-primary mx-auto mb-4 animate-bounce" />
              <p className="text-base font-medium text-primary">{t('dropHere')}</p>
            </div>
          ) : (
            <div className="py-6">
              <div className="flex flex-col items-center mb-4">
                <div className="bg-secondary rounded-full p-4 mb-4">
                  <Upload className="h-8 w-8 text-primary" />
                </div>
                <p className="text-base font-medium mb-2">
                  {t('dragAndDrop')}
                </p>
                <p className="text-sm text-muted-foreground mb-3">
                  {t('acceptedFormats')}: .txt, .zip
                </p>
                <Button variant="outline" size="sm" className="text-sm">
                  <FileText className="mr-2 h-4 w-4" />
                  {t('selectFile')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      {error && (
        <div className="mt-2 p-2 bg-destructive/10 rounded text-sm flex items-center text-destructive">
          <AlertCircle className="h-4 w-4 mr-2" />
          {error}
        </div>
      )}
    </Card>
  );
}
