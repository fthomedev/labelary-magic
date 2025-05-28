
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

        console.log(`Processing PDF block ${i / LABELS_PER_REQUEST + 1}, labels: ${blockLabels.length}, ZPL length: ${blockZPL.length}`);

        const response = await fetch('https://api.labelary.com/v1/printers/8dpmm/labels/4x6/', {
          method: 'POST',
          headers: {
            'Accept': 'application/pdf',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: blockZPL,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
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

  const convertZplBlocksToPngs = async (
    labels: string[],
    onProgress: (progress: number) => void
  ): Promise<Blob[]> => {
    const pngs: Blob[] = [];
    
    for (let i = 0; i < labels.length; i++) {
      try {
        const label = labels[i];
        
        // Validate ZPL format
        if (!label.includes('^XA') || !label.includes('^XZ')) {
          console.error(`Invalid ZPL format for label ${i + 1}:`, label.substring(0, 100));
          throw new Error(`Formato ZPL inválido para etiqueta ${i + 1}`);
        }

        console.log(`Processing PNG label ${i + 1}, ZPL length: ${label.length}`);
        console.log(`ZPL preview:`, label.substring(0, 200));

        const response = await fetch('https://api.labelary.com/v1/printers/8dpmm/labels/4x6/', {
          method: 'POST',
          headers: {
            'Accept': 'image/png',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: label,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`API Error for label ${i + 1}:`, response.status, errorText);
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const blob = await response.blob();
        console.log(`Successfully converted label ${i + 1} to PNG, size: ${blob.size} bytes`);
        pngs.push(blob);

        onProgress(((i + 1) / labels.length) * 100);

        // Delay entre requisições para evitar rate limiting
        if (i < labels.length - 1) {
          await delay(1000);
        }
      } catch (error) {
        console.error(`${t('blockError')} ${i + 1}:`, error);
        toast({
          variant: "destructive",
          title: t('blockError'),
          description: t('blockErrorMessage', { block: i + 1 }),
          duration: 4000,
        });
        
        // Continue processing other labels even if one fails
        continue;
      }
    }
    
    return pngs;
  };

  const parseLabelsFromZpl = (zplContent: string) => {
    console.log('Parsing ZPL content, length:', zplContent.length);
    const labels = splitZPLIntoBlocks(zplContent);
    console.log('Parsed labels count:', labels.length);
    
    // Log first few labels for debugging
    labels.slice(0, 3).forEach((label, index) => {
      console.log(`Label ${index + 1} preview:`, label.substring(0, 150));
    });
    
    return labels;
  };

  const countLabelsInZpl = (zplContent: string): number => {
    const countXAMarkers = (zplContent.match(/\^XA/g) || []).length;
    const count = Math.ceil(countXAMarkers / 2);
    console.log('XA markers found:', countXAMarkers, 'Calculated label count:', count);
    return count;
  };

  return {
    convertZplBlocksToPdfs,
    convertZplBlocksToPngs,
    parseLabelsFromZpl,
    countLabelsInZpl
  };
};
