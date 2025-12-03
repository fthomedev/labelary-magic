
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';
import { useZplLabelProcessor } from './useZplLabelProcessor';
import { useZplValidator } from './useZplValidator';
import { A4_CONFIG, ProcessingConfig } from '@/config/processingConfig';

// Semaphore for controlling concurrent requests
class Semaphore {
  private permits: number;
  private queue: (() => void)[] = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }
    return new Promise<void>(resolve => this.queue.push(resolve));
  }

  release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) next();
    } else {
      this.permits++;
    }
  }
}

export const useA4Conversion = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { splitZplIntoLabels } = useZplLabelProcessor();
  const { filterValidLabels } = useZplValidator();

  const convertZplToA4Images = async (
    labels: string[],
    onProgress: (progress: number) => void,
    config: ProcessingConfig = A4_CONFIG
  ): Promise<Blob[]> => {
    const validLabels = filterValidLabels(labels);
    
    if (validLabels.length === 0) {
      throw new Error('Nenhuma etiqueta válida encontrada para processamento');
    }

    const MAX_CONCURRENT = 10; // High concurrency
    const semaphore = new Semaphore(MAX_CONCURRENT);
    const results: (Blob | null)[] = new Array(validLabels.length).fill(null);
    let completed = 0;
    let rateLimitHits = 0;
    
    console.log(`🖼️ Starting A4 conversion of ${validLabels.length} labels (${MAX_CONCURRENT} concurrent)`);
    const startTime = Date.now();

    const convertLabel = async (label: string, index: number): Promise<void> => {
      await semaphore.acquire();
      
      try {
        let retries = 0;
        const maxRetries = 3;
        
        while (retries < maxRetries) {
          try {
            const response = await fetch('https://api.labelary.com/v1/printers/8dpmm/labels/4x6/0/', {
              method: 'POST',
              headers: {
                'Accept': 'image/png',
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: label,
            });

            if (response.status === 429) {
              rateLimitHits++;
              retries++;
              const waitTime = 1500 * retries;
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue;
            }

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const blob = await response.blob();
            if (blob.size === 0) throw new Error('Empty PNG');
            
            results[index] = blob;
            break;
            
          } catch (error) {
            retries++;
            if (retries < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 500 * retries));
            }
          }
        }
        
        completed++;
        const progressValue = (completed / validLabels.length) * 80;
        onProgress(progressValue);
        
      } finally {
        semaphore.release();
      }
    };

    // Launch all conversions in parallel (semaphore controls concurrency)
    await Promise.all(validLabels.map((label, i) => convertLabel(label, i)));
    
    const finalImages = results.filter((img): img is Blob => img !== null);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    
    console.log(`🎯 A4 conversion complete: ${finalImages.length}/${validLabels.length} in ${elapsed}s (${rateLimitHits} rate limits)`);
    
    return finalImages;
  };

  const parseLabelsFromZpl = (zplContent: string) => {
    console.log('🔍 Parsing ZPL content for A4 processing...');
    const labels = splitZplIntoLabels(zplContent);
    console.log(`📋 parseLabelsFromZpl for A4: Found ${labels.length} labels`);
    
    // Log first few characters of each label for debugging
    labels.forEach((label, index) => {
      console.log(`📄 A4 Label ${index + 1}: ${label.substring(0, 50)}...`);
    });
    
    return labels;
  };

  return {
    convertZplToA4Images,
    parseLabelsFromZpl
  };
};
