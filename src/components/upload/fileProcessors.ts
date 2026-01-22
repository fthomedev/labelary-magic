import { toast } from '@/hooks/use-toast';
import JSZip from 'jszip';

export interface ProcessedFileResult {
  fileName: string;
  fileSize: number;
  labelCount: number;
  content: string;
}

// Count labels in ZPL content (by counting ^XA markers, divided by 2)
// Same logic as standard processing - each label has 2 ^XA markers
const countLabels = (content: string): number => {
  const matches = content.match(/\^XA/gi);
  const xaCount = matches ? matches.length : 0;
  return Math.ceil(xaCount / 2);
};

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

// Process a single file and return detailed info
export const processSingleFile = async (
  file: File,
  t: (key: string, options?: any) => string
): Promise<ProcessedFileResult | null> => {
  try {
    if (file.name.toLowerCase().endsWith('.zip')) {
      const zip = new JSZip();
      const zipContents = await zip.loadAsync(file);
      
      const zplFiles = Object.keys(zipContents.files).filter(
        filename => filename.endsWith('.txt') || filename.endsWith('.zpl')
      );
      
      const allContents: string[] = [];
      for (const filename of zplFiles) {
        const content = await zipContents.files[filename].async('text');
        if (content.includes('^XA') && content.includes('^XZ')) {
          allContents.push(content);
        }
      }
      
      if (allContents.length === 0) return null;
      
      const combinedContent = allContents.join('\n');
      return {
        fileName: file.name,
        fileSize: file.size,
        labelCount: countLabels(combinedContent),
        content: combinedContent,
      };
    } else {
      const content = await readFileAsText(file);
      if (content.includes('^XA') && content.includes('^XZ')) {
        return {
          fileName: file.name,
          fileSize: file.size,
          labelCount: countLabels(content),
          content,
        };
      }
      return null;
    }
  } catch (error) {
    console.error(`Error processing file ${file.name}:`, error);
    return null;
  }
};

export const processMultipleFiles = async (
  files: File[],
  onContentExtracted: (content: string, type: 'file' | 'zip', count: number) => void,
  onError: (message: string) => void,
  onProcessingChange: (isProcessing: boolean) => void,
  t: (key: string, options?: any) => string,
  showToast: boolean = true
) => {
  if (files.length === 0) return;
  
  onProcessingChange(true);
  
  try {
    const allContents: string[] = [];
    let totalFiles = 0;
    let hasZipFiles = false;
    
    for (const file of files) {
      if (file.name.toLowerCase().endsWith('.zip')) {
        hasZipFiles = true;
        try {
          const zip = new JSZip();
          const zipContents = await zip.loadAsync(file);
          
          const zplFiles = Object.keys(zipContents.files).filter(
            filename => filename.endsWith('.txt') || filename.endsWith('.zpl')
          );
          
          for (const filename of zplFiles) {
            const content = await zipContents.files[filename].async('text');
            if (content.includes('^XA') && content.includes('^XZ')) {
              allContents.push(content);
              totalFiles++;
            }
          }
        } catch (zipError) {
          console.error(`Error processing ZIP file ${file.name}:`, zipError);
          onError(t('zipProcessingError'));
          return;
        }
      } else {
        // Process text file
        try {
          const content = await readFileAsText(file);
          if (content.includes('^XA') && content.includes('^XZ')) {
            allContents.push(content);
            totalFiles++;
          }
        } catch (textError) {
          console.error(`Error processing text file ${file.name}:`, textError);
          onError(t('readErrorMessage'));
          return;
        }
      }
    }
    
    if (allContents.length === 0) {
      const errorMessage = t('noValidZplContent');
      onError(errorMessage);
      toast({
        variant: "destructive",
        title: t('error'),
        description: errorMessage,
        duration: 4000,
      });
      return;
    }
    
    const combinedContent = allContents.join('\n');
    const sourceType = hasZipFiles ? 'zip' : 'file';
    
    onContentExtracted(combinedContent, sourceType, totalFiles);
    
    // Only show toast if showToast is true
    if (showToast) {
      toast({
        title: t('filesProcessed'),
        description: t('multipleFilesExtracted', { 
          fileCount: files.length, 
          labelCount: totalFiles 
        }),
        duration: 3000,
      });
    }
    
  } catch (error) {
    console.error('Error processing multiple files:', error);
    onError(t('errorProcessingFiles'));
    toast({
      variant: "destructive",
      title: t('error'),
      description: t('errorProcessingFiles'),
      duration: 4000,
    });
  } finally {
    onProcessingChange(false);
  }
};

const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = () => reject(new Error('Error reading file'));
    reader.readAsText(file);
  });
};
