
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';

interface FileUploadProps {
  onFileSelect: (content: string) => void;
}

export function FileUpload({ onFileSelect }: FileUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onFileSelect(content);
        toast({
          title: "Arquivo carregado com sucesso",
          description: `${file.name} foi processado.`,
        });
      };
      reader.onerror = () => {
        setError('Erro ao ler o arquivo');
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Não foi possível ler o arquivo.",
        });
      };
      reader.readAsText(file);
    }
  }, [onFileSelect, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
  });

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <div
        {...getRootProps()}
        className={`file-drop-area ${isDragActive ? 'dragging' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          {isDragActive ? (
            <p className="text-lg font-medium">Solte o arquivo aqui...</p>
          ) : (
            <>
              <p className="text-lg font-medium mb-2">
                Arraste e solte seu arquivo ZPL aqui
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                ou clique para selecionar
              </p>
              <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Selecionar arquivo
              </Button>
            </>
          )}
        </div>
      </div>
      {error && (
        <div className="mt-4 p-4 bg-destructive/10 rounded-lg flex items-center text-destructive">
          <AlertCircle className="h-4 w-4 mr-2" />
          {error}
        </div>
      )}
    </Card>
  );
}
