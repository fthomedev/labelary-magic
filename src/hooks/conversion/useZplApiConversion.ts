
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';
import { splitZPLIntoBlocks, delay } from '@/utils/pdfUtils';

export const useZplApiConversion = () => {
  const { toast } = useToast();
  const { t } = useTranslation();

  const convertZplBlocksToPdfs = async (
    labels: string[],
    onProgress: (progress: number) => void
  ): Promise<Blob[]> => {
    const pdfs: Blob[] = [];
    const LABELS_PER_REQUEST = 14;
    
    for (let i = 0; i < labels.length; i += LABELS_PER_REQUEST) {
      try {
        const blockLabels = labels.slice(i, i + LABELS_PER_REQUEST);
        const blockZPL = blockLabels.join('');

        console.log(`Processing PDF block ${i / LABELS_PER_REQUEST + 1}, labels: ${blockLabels.length}`);

        const response = await fetch('https://api.labelary.com/v1/printers/8dpmm/labels/4x6/0/', {
          method: 'POST',
          headers: {
            'Accept': 'application/pdf',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: blockZPL,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`API Error: ${response.status} - ${errorText}`);
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const blob = await response.blob();
        pdfs.push(blob);

        onProgress(((i + blockLabels.length) / labels.length) * 100);

        if (i + LABELS_PER_REQUEST < labels.length) {
          await delay(3000);
        }
      } catch (error) {
        console.error(`${t('blockError')} ${i / LABELS_PER_REQUEST + 1}:`, error);
        toast({
          variant: "destructive",
          title: t('blockError'),
          description: t('blockErrorMessage', { block: i / LABELS_PER_REQUEST + 1 }),
          duration: 4000,
        });
      }
    }
    
    return pdfs;
  };

  const validateAndCleanZpl = (zplContent: string): string => {
    let cleanZpl = zplContent.trim();
    
    if (!cleanZpl.startsWith('^XA')) {
      cleanZpl = '^XA' + cleanZpl;
    }
    
    if (!cleanZpl.endsWith('^XZ')) {
      cleanZpl = cleanZpl + '^XZ';
    }
    
    cleanZpl = cleanZpl.replace(/[\r\n\t]/g, '');
    cleanZpl = cleanZpl.replace(/\s+/g, ' ').trim();
    
    return cleanZpl;
  };

  const convertZplBlocksToPngs = async (
    labels: string[],
    onProgress: (progress: number) => void
  ): Promise<Blob[]> => {
    const pngs: Blob[] = [];
    const BATCH_SIZE = 5; // Aumentado para melhor throughput
    const MAX_RETRIES = 3;
    const TIMEOUT_MS = 10000; // 10 segundos de timeout
    
    console.log(`Starting PNG conversion for ${labels.length} labels with ${BATCH_SIZE} parallel batches`);
    
    for (let i = 0; i < labels.length; i += BATCH_SIZE) {
      const batchLabels = labels.slice(i, i + BATCH_SIZE);
      const batchPromises = batchLabels.map(async (rawLabel, batchIndex) => {
        const globalIndex = i + batchIndex;
        let retries = 0;
        
        while (retries <= MAX_RETRIES) {
          try {
            const cleanLabel = validateAndCleanZpl(rawLabel);
            
            if (!cleanLabel || cleanLabel.length < 10 || !cleanLabel.includes('^XA') || !cleanLabel.includes('^XZ')) {
              console.warn(`Label ${globalIndex + 1} invalid, using fallback`);
              const fallbackZpl = `^XA^FO50,50^ADN,36,20^FDLabel ${globalIndex + 1}^FS^XZ`;
              return await convertSingleLabelToPng(fallbackZpl, globalIndex + 1, TIMEOUT_MS);
            }

            return await convertSingleLabelToPng(cleanLabel, globalIndex + 1, TIMEOUT_MS);
          } catch (error) {
            retries++;
            console.warn(`Retry ${retries}/${MAX_RETRIES} for label ${globalIndex + 1}:`, error);
            
            if (retries > MAX_RETRIES) {
              const fallbackZpl = `^XA^FO50,50^ADN,36,20^FDError Label ${globalIndex + 1}^FS^XZ`;
              try {
                return await convertSingleLabelToPng(fallbackZpl, globalIndex + 1, TIMEOUT_MS);
              } catch (fallbackError) {
                console.error(`Failed to create fallback for label ${globalIndex + 1}:`, fallbackError);
                return null;
              }
            }
            
            await delay(100 * retries); // Backoff exponencial
          }
        }
        return null;
      });

      try {
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result) => {
          if (result.status === 'fulfilled' && result.value) {
            pngs.push(result.value);
          }
        });

        // Atualizar progresso de forma mais granular
        const currentProgress = Math.min(((i + batchLabels.length) / labels.length) * 95, 95); // Máximo 95% aqui
        onProgress(currentProgress);

        // Delay menor entre lotes
        if (i + BATCH_SIZE < labels.length) {
          await delay(50);
        }
      } catch (error) {
        console.error(`Batch error at index ${i}:`, error);
      }
    }
    
    // Garantir que chegamos a 100%
    onProgress(100);
    
    console.log(`PNG conversion completed. Successfully converted ${pngs.length}/${labels.length} labels`);
    return pngs;
  };

  const convertSingleLabelToPng = async (zplContent: string, labelNumber: number, timeoutMs: number = 10000): Promise<Blob> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch('https://api.labelary.com/v1/printers/8dpmm/labels/4x6/0/', {
        method: 'POST',
        headers: {
          'Accept': 'image/png',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: zplContent,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API Error for label ${labelNumber}: ${response.status} - ${errorText}`);
      }

      const blob = await response.blob();
      
      if (blob.size === 0) {
        throw new Error(`Empty image returned for label ${labelNumber}`);
      }
      
      return blob;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error(`Timeout converting label ${labelNumber}`);
      }
      throw error;
    }
  };

  const parseLabelsFromZpl = (zplContent: string) => {
    const labels = splitZPLIntoBlocks(zplContent);
    console.log(`Parsed ${labels.length} labels from ZPL content`);
    return labels;
  };

  const countLabelsInZpl = (zplContent: string): number => {
    const countXAMarkers = (zplContent.match(/\^XA/g) || []).length;
    const count = Math.ceil(countXAMarkers / 2);
    return count;
  };

  return {
    convertZplBlocksToPdfs,
    convertZplBlocksToPngs,
    parseLabelsFromZpl,
    countLabelsInZpl
  };
};
