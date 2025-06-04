import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';
import { useA4Conversion } from './useA4Conversion';
import { usePdfMerger } from '../pdf/usePdfMerger';
import { useSupabase } from '../supabase/useSupabase';
import { useZplLabelProcessor } from './useZplLabelProcessor';
import { useHistoryRecords } from '../history/useHistoryRecords';

export const useA4ZplConversion = () => {
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [isProcessingComplete, setIsProcessingComplete] = useState<boolean>(false);
  const [lastPdfUrl, setLastPdfUrl] = useState<string | null>(null);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);
  const { toast } = useToast();
  const { t } = useTranslation();
  const { convertZplToA4Images } = useA4Conversion();
  const { mergePDFs } = usePdfMerger();
  const { uploadPdf } = useSupabase();
  const { parseLabelsFromZpl } = useZplLabelProcessor();
  const { addToProcessingHistory } = useHistoryRecords();

  const convertImagesToA4PDF = async (images: Blob[]): Promise<Blob> => {
    const { jsPDF } = await import('jspdf');
    const a4Width = 210;
    const a4Height = 297;

    const doc = new jsPDF('portrait', 'mm', 'a4');

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      const imgData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(img);
      });

      const imageInfo = await new Promise<{ width: number; height: number }>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve({ width: image.width, height: image.height });
        image.onerror = reject;
        image.src = imgData;
      });

      const imgWidthMm = (imageInfo.width * 25.4) / 300;
      const imgHeightMm = (imageInfo.height * 25.4) / 300;

      let x = (a4Width - imgWidthMm) / 2;
      let y = (a4Height - imgHeightMm) / 2;

      if (x < 0) x = 0;
      if (y < 0) y = 0;

      doc.addImage(imgData, 'PNG', x, y, imgWidthMm, imgHeightMm);

      if (i < images.length - 1) {
        doc.addPage();
      }
    }

    return new Promise<Blob>((resolve) => {
      doc.output('blob', resolve);
    });
  };

  const convertToA4PDF = async (zplContent: string) => {
    if (!zplContent.trim()) {
      toast({
        variant: "destructive",
        title: t('emptyContent'),
        description: t('emptyContentDesc'),
        duration: 3000,
      });
      return;
    }

    setIsConverting(true);
    setProgress(0);
    setIsProcessingComplete(false);
    setLastPdfUrl(null);
    
    const startTime = Date.now();
    console.log('🚀 Starting A4 PDF conversion process...');

    try {
      const labels = parseLabelsFromZpl(zplContent);
      console.log(`📊 Converting ${labels.length} labels to A4 PDF format`);

      if (labels.length === 0) {
        throw new Error(t('noValidLabels'));
      }

      // Convert to images first
      const images = await convertZplToA4Images(labels, setProgress);
      console.log(`🖼️ Generated ${images.length} images for A4 conversion`);

      if (images.length === 0) {
        throw new Error(t('noImagesGenerated'));
      }

      setProgress(80);
      
      // Convert images to A4 PDF
      const a4Pdf = await convertImagesToA4PDF(images);
      console.log(`📄 Generated A4 PDF size: ${a4Pdf.size} bytes`);

      setProgress(90);
      
      // Upload PDF
      const fileName = `etiquetas-a4-${Date.now()}.pdf`;
      const pdfPath = await uploadPdf(a4Pdf, fileName);
      console.log(`☁️ Uploaded A4 PDF to: ${pdfPath}`);

      const endTime = Date.now();
      const processingTime = endTime - startTime;
      console.log(`⏱️ A4 conversion completed in ${processingTime}ms`);

      // Save to history with A4 type
      await addToProcessingHistory(labels.length, pdfPath, processingTime, 'a4');

      const { data: publicUrlData } = await supabase.storage
        .from('pdfs')
        .getPublicUrl(pdfPath);

      if (publicUrlData?.publicUrl) {
        setLastPdfUrl(publicUrlData.publicUrl);
        setProgress(100);
        setIsProcessingComplete(true);
        setHistoryRefreshTrigger(prev => prev + 1);

        toast({
          title: t('a4ConversionComplete'),
          description: t('a4ConversionCompleteDesc', { count: labels.length }),
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('A4 conversion failed:', error);
      
      toast({
        variant: "destructive",
        title: t('conversionError'),
        description: error instanceof Error ? error.message : t('unknownError'),
        duration: 5000,
      });
    } finally {
      setIsConverting(false);
    }
  };

  const resetProcessingStatus = () => {
    setIsConverting(false);
    setProgress(0);
    setIsProcessingComplete(false);
    setLastPdfUrl(null);
  };

  return {
    isConverting,
    progress,
    isProcessingComplete,
    lastPdfUrl,
    convertToA4PDF,
    resetProcessingStatus,
    historyRefreshTrigger
  };
};
