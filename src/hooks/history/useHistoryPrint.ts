
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ProcessingRecord } from '@/hooks/useZplConversion';

export function useHistoryPrint() {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const handlePrint = useCallback(async (record: ProcessingRecord) => {
    try {
      let pdfArrayBuffer: ArrayBuffer | null = null;

      // Para registros que têm um storage path, sempre usar esse (mais confiável após refresh da página)
      if (record.pdfPath) {
        console.log('Fazendo fetch do PDF para impressão do storage path:', record.pdfPath);
        
        // Fazer download direto do arquivo usando signed URL
        const { data, error } = await supabase.storage
          .from('pdfs')
          .createSignedUrl(record.pdfPath, 300); // 5 minutos de expiração para impressão
          
        if (error || !data?.signedUrl) {
          console.error('Erro ao criar signed URL para impressão:', error);
          throw new Error('Falha ao criar URL de impressão');
        }
        
        console.log('Signed URL criada com sucesso para impressão:', data.signedUrl);
        
        // Fazer fetch do PDF
        const response = await fetch(data.signedUrl);
        if (!response.ok) {
          throw new Error('Falha ao fazer download do PDF');
        }
        
        pdfArrayBuffer = await response.arrayBuffer();
      } 
      // Se o pdfUrl é uma URL completa (não um blob), usar essa diretamente
      else if (record.pdfUrl && !record.pdfUrl.startsWith('blob:')) {
        console.log('Fazendo fetch da URL direta do Supabase para impressão:', record.pdfUrl);
        
        const response = await fetch(record.pdfUrl);
        if (!response.ok) {
          throw new Error('Falha ao fazer download do PDF');
        }
        
        pdfArrayBuffer = await response.arrayBuffer();
      }
      // Fallback para blob URL se disponível (para PDFs recém-criados)
      else if (record.pdfUrl && record.pdfUrl.startsWith('blob:')) {
        console.log('Tentando usar blob URL para impressão:', record.pdfUrl);
        
        // Verificar se a blob URL ainda é válida
        try {
          const response = await fetch(record.pdfUrl);
          
          if (!response.ok) {
            throw new Error('Blob URL não é mais válida');
          }
          
          pdfArrayBuffer = await response.arrayBuffer();
        } catch (e) {
          console.error('Erro com blob URL para impressão:', e);
          throw new Error('Blob URL não é mais acessível após refresh da página');
        }
      }

      if (!pdfArrayBuffer) {
        throw new Error('Nenhuma URL de PDF válida ou path disponível para impressão');
      }

      // Criar blob URL a partir do ArrayBuffer
      const pdfBlob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(pdfBlob);

      // Abrir PDF em nova janela para impressão (mais seguro e compatível)
      const printWindow = window.open(blobUrl, '_blank');
      
      if (!printWindow) {
        // Se popup foi bloqueado, tentar download direto
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `etiquetas-${record.labelCount}-labels.pdf`;
        link.click();
        
        toast({
          title: t('printStarted'),
          description: 'PDF baixado - abra o arquivo e imprima manualmente',
          duration: 4000,
        });
      } else {
        // Aguardar o carregamento do PDF e tentar imprimir
        printWindow.onload = () => {
          setTimeout(() => {
            try {
              printWindow.print();
              // Fechar janela após impressão (alguns navegadores)
              setTimeout(() => {
                printWindow.close();
                URL.revokeObjectURL(blobUrl);
              }, 1000);
            } catch (printError) {
              console.error('Erro ao imprimir:', printError);
              // Se falhar, manter janela aberta para impressão manual
            }
          }, 1000);
        };
        
        toast({
          title: t('printStarted'),
          description: t('printStartedDesc'),
          duration: 3000,
        });
      }
      
    } catch (error) {
      console.error('Erro ao imprimir PDF:', error);
      toast({
        variant: "destructive",
        title: t('error'),
        description: t('printError'),
        duration: 3000,
      });
    }
  }, [t, toast]);

  return { handlePrint };
}
