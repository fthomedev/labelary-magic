
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ProcessingResult {
  labelNumber: number;
  success: boolean;
  error?: string;
  pngUrl?: string;
  size?: number;
}

export const useZplLabelProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ProcessingResult[]>([]);
  const { toast } = useToast();
  const { t } = useTranslation();

  const splitZplIntoLabels = (zplContent: string): string[] => {
    console.log('🔍 Starting ZPL label splitting...');
    
    // Remove extra whitespace and normalize line endings
    const normalizedContent = zplContent.trim().replace(/\r\n/g, '\n');
    
    // Split by ^XZ and filter for blocks that contain ^XA
    const rawBlocks = normalizedContent.split('^XZ');
    const labels: string[] = [];
    
    rawBlocks.forEach((block, index) => {
      const trimmedBlock = block.trim();
      if (trimmedBlock.includes('^XA')) {
        // Add back the ^XZ marker
        const completeLabel = `${trimmedBlock}^XZ`;
        labels.push(completeLabel);
        console.log(`📋 Label ${index + 1} extracted: ${completeLabel.length} characters`);
      }
    });
    
    console.log(`✅ Found ${labels.length} valid ZPL labels`);
    return labels;
  };

  const processLabelToPng = async (
    labelContent: string, 
    labelNumber: number
  ): Promise<ProcessingResult> => {
    console.log(`🖼️ Processing label ${labelNumber}...`);
    
    try {
      const response = await fetch('https://api.labelary.com/v1/printers/8dpmm/labels/4x6/0/', {
        method: 'POST',
        headers: {
          'Accept': 'image/png',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: labelContent,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Label ${labelNumber} failed with HTTP ${response.status}: ${errorText}`);
        
        return {
          labelNumber,
          success: false,
          error: `HTTP ${response.status}: ${errorText.substring(0, 100)}...`
        };
      }

      const pngBlob = await response.blob();
      
      if (pngBlob.size === 0) {
        console.error(`❌ Label ${labelNumber} returned empty PNG`);
        return {
          labelNumber,
          success: false,
          error: 'Empty PNG received from API'
        };
      }

      // Generate timestamp-based filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `label-${timestamp}-${labelNumber.toString().padStart(3, '0')}.png`;
      
      // Upload to Supabase storage
      const pngUrl = await uploadPngToStorage(pngBlob, fileName);
      
      console.log(`✅ Label ${labelNumber} processed successfully: ${pngBlob.size} bytes -> ${pngUrl}`);
      
      return {
        labelNumber,
        success: true,
        pngUrl,
        size: pngBlob.size
      };
      
    } catch (error) {
      console.error(`💥 Label ${labelNumber} processing error:`, error);
      return {
        labelNumber,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  };

  const uploadPngToStorage = async (pngBlob: Blob, fileName: string): Promise<string> => {
    try {
      // Get current user for RLS-compliant file path
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Ensure PNG bucket exists (private bucket)
      const { error: bucketError } = await supabase.storage.getBucket('pngs');
      if (bucketError && bucketError.message.includes('The resource was not found')) {
        await supabase.storage.createBucket('pngs', {
          public: false,
          fileSizeLimit: 5242880 // 5MB
        });
        console.log('📁 Created PNG bucket (private)');
      }

      // Store in user-specific folder for RLS compliance
      const filePath = `${user.id}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('pngs')
        .upload(filePath, pngBlob, {
          contentType: 'image/png',
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Storage upload error:', error);
        throw error;
      }

      // Get signed URL (private bucket requires signed URLs)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('pngs')
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (signedUrlError || !signedUrlData?.signedUrl) {
        console.error('Failed to create signed URL:', signedUrlError);
        throw signedUrlError || new Error('Failed to create signed URL');
      }

      return signedUrlData.signedUrl;
    } catch (error) {
      console.error('Failed to upload PNG to storage:', error);
      throw error;
    }
  };

  const processAllLabels = async (
    zplContent: string,
    onProgress?: (progress: number, currentLabel: number, totalLabels: number) => void
  ) => {
    setIsProcessing(true);
    setResults([]);
    
    try {
      console.log('🚀 Starting full ZPL processing pipeline...');
      
      // Step 1: Split ZPL into individual labels
      const labels = splitZplIntoLabels(zplContent);
      
      if (labels.length === 0) {
        throw new Error('No valid ZPL labels found in content');
      }

      // Step 2: Process each label individually
      const processingResults: ProcessingResult[] = [];
      
      for (let i = 0; i < labels.length; i++) {
        const labelContent = labels[i];
        const labelNumber = i + 1;
        
        onProgress?.(
          ((i) / labels.length) * 100,
          labelNumber,
          labels.length
        );
        
        const result = await processLabelToPng(labelContent, labelNumber);
        processingResults.push(result);
        
        // Add delay between requests to be respectful to the API
        if (i < labels.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      onProgress?.(100, labels.length, labels.length);
      
      setResults(processingResults);
      
      // Summary logging
      const successful = processingResults.filter(r => r.success).length;
      const failed = processingResults.filter(r => !r.success).length;
      
      console.log(`📊 Processing complete: ${successful} successful, ${failed} failed`);
      
      if (failed > 0) {
        console.log('❌ Failed labels:');
        processingResults
          .filter(r => !r.success)
          .forEach(r => console.log(`  - Label ${r.labelNumber}: ${r.error}`));
      }
      
      toast({
        title: 'Processamento Concluído',
        description: `${successful} etiquetas processadas com sucesso${failed > 0 ? `, ${failed} falharam` : ''}`,
        duration: 5000,
      });
      
      return processingResults;
      
    } catch (error) {
      console.error('💥 Full processing pipeline failed:', error);
      toast({
        variant: "destructive",
        title: 'Erro no Processamento',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        duration: 5000,
      });
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    results,
    splitZplIntoLabels,
    processLabelToPng,
    processAllLabels
  };
};
