
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

        const response = await fetch('https://api.labelary.com/v1/printers/8dpmm/labels/4x6/', {
          method: 'POST',
          headers: {
            'Accept': 'image/png',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: label,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const blob = await response.blob();
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
      }
    }
    
    return pngs;
  };

  const parseLabelsFromZpl = (zplContent: string) => {
    return splitZPLIntoBlocks(zplContent);
  };

  const countLabelsInZpl = (zplContent: string): number => {
    const countXAMarkers = (zplContent.match(/\^XA/g) || []).length;
    return Math.ceil(countXAMarkers / 2);
  };

  return {
    convertZplBlocksToPdfs,
    convertZplBlocksToPngs,
    parseLabelsFromZpl,
    countLabelsInZpl
  };
};
