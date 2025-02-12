
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';

interface FileUploadProps {
  onFileSelect: (content: string) => void;
}

export function FileUpload({ onFileSelect }: FileUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onFileSelect(content);
        toast({
          title: t('fileUploaded'),
          description: t('fileProcessed', { fileName: file.name }),
        });
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
    }
  }, [onFileSelect, toast, t]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
  });

  return (
    <Card className="w-full max-w-xl mx-auto">
      <div
        {...getRootProps()}
        className="p-4 border-2 border-dashed border-border rounded-lg hover:border-primary/50 transition-colors"
      >
        <input {...getInputProps()} />
        <div className="text-center">
          <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
          {isDragActive ? (
            <p className="text-sm font-medium">{t('dropHere')}</p>
          ) : (
            <>
              <p className="text-sm font-medium mb-2">
                {t('dragAndDrop')}
              </p>
              <p className="text-xs text-muted-foreground mb-2">
                {t('or')} {t('clickToSelect')}
              </p>
              <Button variant="outline" size="sm">
                <FileText className="mr-2 h-3 w-3" />
                {t('selectFile')}
              </Button>
            </>
          )}
        </div>
      </div>
      {error && (
        <div className="mt-2 p-2 bg-destructive/10 rounded text-xs flex items-center text-destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          {error}
        </div>
      )}
    </Card>
  );
}
