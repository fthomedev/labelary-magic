import { splitZPLIntoBlocks, mergePDFs, delay } from '@/utils/pdfUtils';

const MAX_BATCH_SIZE_BYTES = 1.8 * 1024 * 1024; // 1.8MB (safety margin under 2MB limit)
const MAX_LABELS_PER_BATCH = 50; // Labelary max labels per request
const BATCH_DELAY_MS = 400; // Delay between batches to avoid rate limits
const IMAGE_SIZE_MULTIPLIER = 6; // Embedded images consume ~6x more resources when rendered (increased from 4)

// Estimate label size in bytes
const estimateLabelSize = (label: string): number => {
  return new Blob([label]).size;
};

// Detect if label contains embedded images
const hasEmbeddedImage = (label: string): boolean => {
  return label.includes('~DG') || label.includes(':Z64:') || label.includes('~EG');
};

// Calculate optimal batch size based on label content
const calculateOptimalBatchSize = (labels: string[]): number => {
  if (labels.length === 0) return 1;
  
  // Sample first few labels to estimate average size
  const sampleSize = Math.min(5, labels.length);
  const sampleLabels = labels.slice(0, sampleSize);
  const totalSampleSize = sampleLabels.reduce((sum, label) => sum + estimateLabelSize(label), 0);
  const avgSize = totalSampleSize / sampleSize;
  
  // Check if labels contain embedded images
  const containsImages = sampleLabels.some(label => hasEmbeddedImage(label));
  
  // Apply multiplier for images (rendered images consume more resources than ZPL text)
  const effectiveSize = containsImages ? avgSize * IMAGE_SIZE_MULTIPLIER : avgSize;
  
  // Calculate how many labels fit in 1.8MB
  const optimalBatch = Math.floor(MAX_BATCH_SIZE_BYTES / effectiveSize);
  
  // Clamp between 1 and 50
  const batchSize = Math.max(1, Math.min(MAX_LABELS_PER_BATCH, optimalBatch));
  
  console.log(`📏 Label analysis: avg=${(avgSize / 1024).toFixed(1)}KB, hasImages=${containsImages}, effectiveSize=${(effectiveSize / 1024).toFixed(1)}KB, batch=${batchSize}`);
  
  return batchSize;
};

// Custom error class to carry specific error messages
export class A4ConversionError extends Error {
  public readonly userMessage: string;
  public readonly technicalDetails: string;
  
  constructor(userMessage: string, technicalDetails: string) {
    super(userMessage);
    this.name = 'A4ConversionError';
    this.userMessage = userMessage;
    this.technicalDetails = technicalDetails;
  }
}

export const useA4DirectConversion = () => {
  
  const convertZplToA4PDFDirect = async (
    zplContent: string,
    onProgress: (progress: number) => void
  ): Promise<{ pdfBlob: Blob; labelCount: number }> => {
    console.log('\n========== A4 DIRECT CONVERSION (NO UPSCALING) ==========');
    console.log('🚀 Using DIRECT A4 API path (12dpmm, X-Page-Size: A4)');
    
    const labels = splitZPLIntoBlocks(zplContent);
    const labelCount = labels.length;
    
    console.log(`📊 Total labels to convert: ${labelCount}`);
    console.log(`📊 ZPL content length: ${zplContent.length} chars`);
    
    if (labelCount === 0) {
      throw new A4ConversionError(
        'Nenhuma etiqueta ZPL válida encontrada',
        'No valid ZPL labels found in content'
      );
    }
    
    // Calculate optimal batch size based on label content
    let batchSize = calculateOptimalBatchSize(labels);
    
    // Split into batches using calculated size
    let batches: string[][] = [];
    for (let i = 0; i < labels.length; i += batchSize) {
      batches.push(labels.slice(i, i + batchSize));
    }
    
    console.log(`📦 Split into ${batches.length} batch(es) with size ${batchSize}`);
    
    const pdfBlobs: Blob[] = [];
    let processedLabels = 0;
    let currentBatchIndex = 0;
    
    while (currentBatchIndex < batches.length) {
      const batch = batches[currentBatchIndex];
      const batchZpl = batch.join('\n');
      
      console.log(`\n🔄 Processing batch ${currentBatchIndex + 1}/${batches.length} (${batch.length} labels)`);
      
      // Add delay between batches (except first)
      if (currentBatchIndex > 0) {
        console.log(`⏳ Waiting ${BATCH_DELAY_MS}ms before next batch...`);
        await delay(BATCH_DELAY_MS);
      }
      
      const result = await fetchA4PDFFromLabelary(batchZpl, batch.length);
      
      if (result.success && result.blob) {
        pdfBlobs.push(result.blob);
        processedLabels += batch.length;
        
        // Update progress (0-90%)
        const progress = Math.round((processedLabels / labelCount) * 90);
        onProgress(progress);
        console.log(`✅ Batch ${currentBatchIndex + 1} complete - Progress: ${progress}%`);
        currentBatchIndex++;
      } else if (result.errorType === 'size_limit' && batch.length > 1) {
        // Reduce batch size and re-split remaining labels
        const newBatchSize = Math.max(1, Math.floor(batch.length / 2));
        console.warn(`⚠️ Batch too large (2MB limit), reducing size from ${batch.length} to ${newBatchSize}`);
        
        // Re-split current and remaining batches
        const remainingLabels = batches.slice(currentBatchIndex).flat();
        batches = [
          ...batches.slice(0, currentBatchIndex),
          ...splitIntoBatches(remainingLabels, newBatchSize)
        ];
        console.log(`📦 Re-split into ${batches.length} batches`);
        // Don't increment currentBatchIndex - retry with smaller batch
      } else {
        // Fatal error
        console.error(`❌ Batch ${currentBatchIndex + 1} failed: ${result.errorMessage}`);
        throw new A4ConversionError(
          result.userMessage || 'Erro ao processar etiquetas',
          result.errorMessage || 'Unknown error'
        );
      }
    }
    
    // Merge all PDF batches if more than one
    console.log('\n📑 Merging PDF batches...');
    onProgress(95);
    
    let finalPdf: Blob;
    if (pdfBlobs.length === 1) {
      finalPdf = pdfBlobs[0];
    } else {
      finalPdf = await mergePDFs(pdfBlobs);
    }
    
    onProgress(100);
    console.log(`✅ A4 Direct conversion complete - ${labelCount} labels`);
    console.log('========== END A4 DIRECT CONVERSION ==========\n');
    
    return { pdfBlob: finalPdf, labelCount };
  };
  
  // Helper to split labels into batches
  const splitIntoBatches = (labels: string[], batchSize: number): string[][] => {
    const batches: string[][] = [];
    for (let i = 0; i < labels.length; i += batchSize) {
      batches.push(labels.slice(i, i + batchSize));
    }
    return batches;
  };
  
  interface FetchResult {
    success: boolean;
    blob?: Blob;
    errorType?: 'size_limit' | 'rate_limit' | 'other';
    errorMessage?: string;
    userMessage?: string;
  }
  
  const fetchA4PDFFromLabelary = async (
    zplContent: string,
    labelCount: number,
    retries: number = 3
  ): Promise<FetchResult> => {
    const baseUrl = 'https://api.labelary.com/v1/printers/12dpmm/labels/4x6/';
    
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`📡 Labelary A4 request (attempt ${attempt}/${retries}) - ${labelCount} labels`);
        
        const response = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            'Accept': 'application/pdf',
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Page-Size': 'A4',
            'X-Page-Layout': '2x2',
            'X-Page-Align': 'Center',
            'X-Page-Vertical-Align': 'Center',
            'X-Label-Border': 'None'
          },
          body: zplContent
        });
        
        if (response.status === 429) {
          const retryDelay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.warn(`⚠️ Rate limited (429), waiting ${retryDelay}ms...`);
          await delay(retryDelay);
          continue;
        }
        
        if (response.status === 400) {
          const errorText = await response.text();
          console.error(`❌ Labelary error 400: ${errorText}`);
          
          // Check for size limit error
          if (errorText.includes('exceeds the maximum') || errorText.includes('2 MB')) {
            return {
              success: false,
              errorType: 'size_limit',
              errorMessage: errorText,
              userMessage: `Limite de 2MB excedido. Tentando com menos etiquetas por lote...`
            };
          }
          
          // Other 400 errors
          return {
            success: false,
            errorType: 'other',
            errorMessage: errorText,
            userMessage: `Erro na etiqueta ZPL: ${errorText.substring(0, 100)}`
          };
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Labelary error: ${response.status} ${response.statusText}`);
          console.error(`❌ Error body: ${errorText}`);
          
          if (attempt < retries) {
            await delay(1000 * attempt);
            continue;
          }
          
          return {
            success: false,
            errorType: 'other',
            errorMessage: `HTTP ${response.status}: ${errorText}`,
            userMessage: `Erro do servidor: ${response.status}`
          };
        }
        
        const blob = await response.blob();
        console.log(`✅ Received PDF: ${(blob.size / 1024).toFixed(1)}KB`);
        return { success: true, blob };
        
      } catch (error) {
        console.error(`❌ Request error (attempt ${attempt}):`, error);
        if (attempt < retries) {
          await delay(1000 * attempt);
          continue;
        }
        return {
          success: false,
          errorType: 'other',
          errorMessage: error instanceof Error ? error.message : 'Network error',
          userMessage: 'Erro de conexão com o servidor'
        };
      }
    }
    
    return {
      success: false,
      errorType: 'other',
      errorMessage: 'Max retries exceeded',
      userMessage: 'Servidor ocupado, tente novamente'
    };
  };
  
  return {
    convertZplToA4PDFDirect
  };
};
