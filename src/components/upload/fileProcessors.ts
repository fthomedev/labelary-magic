
import { toast } from '@/hooks/use-toast';
import JSZip from 'jszip';

export const processZipFile = async (
  file: File,
  onContentExtracted: (content: string, type: 'zip', count: number) => void,
  onError: (message: string) => void,
  onProcessingChange: (isProcessing: boolean) => void,
  t: (key: string, options?: any) => string
) => {
  onProcessingChange(true);
  try {
    const zip = new JSZip();
    const zipContents = await zip.loadAsync(file);
    
    const zplFiles = Object.keys(zipContents.files).filter(
      filename => filename.endsWith('.txt') || filename.endsWith('.zpl')
    );
    
    if (zplFiles.length === 0) {
      const errorMessage = t('noZplFilesInZip');
      onError(errorMessage);
      toast({
        variant: "destructive",
        title: t('error'),
        description: errorMessage,
        duration: 4000,
      });
      throw new Error(errorMessage);
    }
    
    const fileContents: string[] = [];
    for (const filename of zplFiles) {
      const content = await zipContents.files[filename].async('text');
      if (content.includes('^XA') && content.includes('^XZ')) {
        fileContents.push(content);
      }
    }
    
    if (fileContents.length === 0) {
      const errorMessage = t('noValidZplContent');
      onError(errorMessage);
      toast({
        variant: "destructive",
        title: t('error'),
        description: errorMessage,
        duration: 4000,
      });
      throw new Error(errorMessage);
    }
    
    const allContent = fileContents.join('\n');
    onContentExtracted(allContent, 'zip', fileContents.length);
    
    toast({
      title: t('zipProcessed'),
      description: t('zipFilesExtracted', { count: fileContents.length }),
      duration: 3000,
    });
  } catch (error) {
    console.error('Error processing ZIP file:', error);
    if (!error.message.includes(t('noZplFilesInZip')) && !error.message.includes(t('noValidZplContent'))) {
      onError(t('zipProcessingError'));
      toast({
        variant: "destructive",
        title: t('error'),
        description: t('zipProcessingError'),
        duration: 4000,
      });
    }
  } finally {
    onProcessingChange(false);
  }
};

export const processTextFile = (
  file: File,
  onContentExtracted: (content: string, type: 'file', count: number) => void,
  onError: (message: string) => void,
  t: (key: string, options?: any) => string
) => {
  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target?.result as string;
    if (content.includes('^XA') && content.includes('^XZ')) {
      onContentExtracted(content, 'file', 1);
      toast({
        title: t('fileUploaded'),
        description: t('fileProcessed', { fileName: file.name }),
        duration: 3000,
      });
    } else {
      const errorMessage = t('noValidZplContent');
      onError(errorMessage);
      toast({
        variant: "destructive",
        title: t('error'),
        description: errorMessage,
        duration: 4000,
      });
    }
  };
  reader.onerror = () => {
    const errorMessage = t('readErrorMessage');
    onError(errorMessage);
    toast({
      variant: "destructive",
      title: t('readError'),
      description: errorMessage,
      duration: 4000,
    });
  };
  reader.readAsText(file);
};
