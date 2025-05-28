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

        // URL corrigida para a API Labelary - usando o formato correto
        const response = await fetch('https://api.labelary.com/v1/printers/8dpmm/labels/4x6/0/', {
          method: 'POST',
          headers: {
            'Accept': 'application/pdf',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: blockZPL,
        });

        console.log('API Response status:', response.status);
        console.log('API Response headers:', Object.fromEntries(response.headers.entries()));

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`API Error: ${response.status} - ${errorText}`);
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const blob = await response.blob();
        console.log('PDF blob size:', blob.size, 'bytes');
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
    
    console.log('Starting PNG conversion for', labels.length, 'labels');
    
    for (let i = 0; i < labels.length; i++) {
      try {
        const label = labels[i];
        
        console.log(`Processing PNG label ${i + 1}/${labels.length}`);
        console.log(`ZPL content for label ${i + 1}:`, label.substring(0, 200));

        // Verificação básica do ZPL
        if (!label || label.trim().length < 5) {
          console.error(`Label ${i + 1} is too short or empty:`, label);
          throw new Error(`Etiqueta ${i + 1} está vazia ou muito curta`);
        }

        // URL corrigida para a API Labelary - adicionando o "/0/" no final
        const response = await fetch('https://api.labelary.com/v1/printers/8dpmm/labels/4x6/0/', {
          method: 'POST',
          headers: {
            'Accept': 'image/png',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: label,
        });

        console.log(`PNG API Response for label ${i + 1}:`, {
          status: response.status,
          statusText: response.statusText,
          url: response.url
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`API Error for label ${i + 1}:`, {
            status: response.status,
            statusText: response.statusText,
            error: errorText,
            zplContent: label.substring(0, 200)
          });
          
          throw new Error(`Erro da API (${response.status}): ${errorText || 'Erro desconhecido'}`);
        }

        const blob = await response.blob();
        console.log(`Successfully converted label ${i + 1} to PNG, size: ${blob.size} bytes`);
        
        if (blob.size === 0) {
          throw new Error(`API retornou imagem vazia para etiqueta ${i + 1}`);
        }
        
        pngs.push(blob);
        onProgress(((i + 1) / labels.length) * 100);

        // Delay menor entre requisições
        if (i < labels.length - 1) {
          await delay(500);
        }
      } catch (error) {
        console.error(`Erro ao converter etiqueta ${i + 1} para PNG:`, error);
        toast({
          variant: "destructive",
          title: `Erro na etiqueta ${i + 1}`,
          description: `${error instanceof Error ? error.message : 'Erro desconhecido'}`,
          duration: 6000,
        });
      }
    }
    
    console.log(`PNG conversion completed. Successfully converted ${pngs.length}/${labels.length} labels`);
    return pngs;
  };

  const parseLabelsFromZpl = (zplContent: string) => {
    console.log('Parsing ZPL content, length:', zplContent.length);
    const labels = splitZPLIntoBlocks(zplContent);
    console.log('Parsed labels count:', labels.length);
    
    // Log das primeiras etiquetas para debug
    labels.slice(0, 2).forEach((label, index) => {
      console.log(`Label ${index + 1} preview (first 200 chars):`, label.substring(0, 200));
      console.log(`Label ${index + 1} preview (last 50 chars):`, label.slice(-50));
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
