
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';
import { useZplValidator } from './useZplValidator';
import { useLabelProcessor } from './useLabelProcessor';
import { splitZplIntoLabels } from '@/utils/zplSplitter';

interface ProcessingResult {
  labelNumber: number;
  success: boolean;
  error?: string;
  pngUrl?: string;
  size?: number;
  validationWarnings?: string[];
  skipped?: boolean;
}

export const useZplLabelProcessor = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [results, setResults] = useState<ProcessingResult[]>([]);
  const { toast } = useToast();
  const { t } = useTranslation();
  const { validateAllLabels } = useZplValidator();
  const { processLabelToPng } = useLabelProcessor();

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

      console.log(`📋 Found ${labels.length} potential ZPL labels to process`);

      // Step 2: Validate all labels first
      console.log('🔍 Pre-validating all labels...');
      const validationResults = validateAllLabels(labels);
      
      const validLabels = validationResults.filter(r => r.isValid);
      const invalidLabels = validationResults.filter(r => !r.isValid);
      
      console.log(`📊 Validation results: ${validLabels.length} valid, ${invalidLabels.length} invalid`);
      
      if (invalidLabels.length > 0) {
        console.log(`⚠️ Found ${invalidLabels.length} invalid labels that will be skipped`);
        invalidLabels.forEach(invalid => {
          console.log(`❌ Label ${invalid.labelNumber} errors:`, invalid.errors);
        });
        
        toast({
          variant: "destructive",
          title: 'Validação ZPL',
          description: `${invalidLabels.length} etiquetas inválidas serão ignoradas (verifique os logs para detalhes)`,
          duration: 7000,
        });
      }

      // Step 3: Process each label individually
      const processingResults: ProcessingResult[] = [];
      
      for (let i = 0; i < labels.length; i++) {
        const labelContent = labels[i];
        const labelNumber = i + 1;
        
        console.log(`\n🔄 Processing label ${labelNumber}/${labels.length}...`);
        
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
      const failed = processingResults.filter(r => !r.success && !r.skipped).length;
      const skipped = processingResults.filter(r => r.skipped).length;
      const withWarnings = processingResults.filter(r => r.validationWarnings && r.validationWarnings.length > 0).length;
      
      console.log(`\n📊 Processing complete:`);
      console.log(`  ✅ ${successful} successful`);
      console.log(`  ❌ ${failed} failed`);
      console.log(`  ⏭️ ${skipped} skipped`);
      console.log(`  ⚠️ ${withWarnings} with warnings`);
      
      if (failed > 0) {
        console.log('\n❌ Failed labels:');
        processingResults
          .filter(r => !r.success && !r.skipped)
          .forEach(r => console.log(`  - Label ${r.labelNumber}: ${r.error}`));
      }
      
      if (skipped > 0) {
        console.log('\n⏭️ Skipped labels:');
        processingResults
          .filter(r => r.skipped)
          .forEach(r => console.log(`  - Label ${r.labelNumber}: ${r.error}`));
      }
      
      toast({
        title: 'Processamento Concluído',
        description: `${successful} etiquetas processadas com sucesso${failed > 0 ? `, ${failed} falharam` : ''}${skipped > 0 ? `, ${skipped} ignoradas` : ''}${withWarnings > 0 ? `, ${withWarnings} com avisos` : ''}`,
        duration: 7000,
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
