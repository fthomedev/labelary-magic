import { supabase } from "@/integrations/supabase/client";

const BATCH_SIZE = 12; // Labels per Edge Function request
const PARALLEL_BATCHES = 2; // Concurrent Edge Function calls

/**
 * Hook for server-side ZPL to HD PNG conversion.
 * Sends batches of ZPL labels to the Edge Function which handles:
 * 1. Labelary API conversion (with rate limit handling)
 * 2. Nearest Neighbor upscaling (2x)
 * 3. Returns base64 PNGs
 */
export const useServerZplConversion = () => {
  
  const base64ToBlob = (base64: string, mimeType: string = 'image/png'): Blob => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType });
  };

  const convertZplToHdImages = async (
    labels: string[],
    onProgress: (current: number, total: number) => void
  ): Promise<Blob[]> => {
    console.log(`\n🚀 Server-side HD conversion: ${labels.length} labels`);
    const startTime = Date.now();
    
    // Get auth token
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('User not authenticated');
    }
    
    // Create batches
    const batches: string[][] = [];
    for (let i = 0; i < labels.length; i += BATCH_SIZE) {
      batches.push(labels.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`📦 Created ${batches.length} batches of ~${BATCH_SIZE} labels`);
    
    const results: (Blob | null)[] = new Array(labels.length).fill(null);
    let processedLabels = 0;
    
    // Process batches in parallel groups
    for (let i = 0; i < batches.length; i += PARALLEL_BATCHES) {
      const parallelBatches = batches.slice(i, i + PARALLEL_BATCHES);
      const batchStartIndices = parallelBatches.map((_, j) => (i + j) * BATCH_SIZE);
      
      const batchPromises = parallelBatches.map(async (batch, j) => {
        const startIdx = batchStartIndices[j];
        
        try {
          console.log(`📤 Sending batch ${i + j + 1}/${batches.length} (${batch.length} labels)`);
          
          const response = await supabase.functions.invoke('convert-zpl-hd', {
            body: { labels: batch }
          });
          
          if (response.error) {
            console.error(`❌ Batch ${i + j + 1} error:`, response.error);
            return { startIdx, images: new Array(batch.length).fill(null) };
          }
          
          const { images, stats } = response.data;
          console.log(`✅ Batch ${i + j + 1}: ${stats.success}/${stats.total} in ${stats.processingTimeMs}ms`);
          
          return { startIdx, images };
        } catch (error) {
          console.error(`❌ Batch ${i + j + 1} failed:`, error);
          return { startIdx, images: new Array(batch.length).fill(null) };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      
      // Collect results
      for (const { startIdx, images } of batchResults) {
        images.forEach((base64: string | null, idx: number) => {
          if (base64) {
            results[startIdx + idx] = base64ToBlob(base64);
          }
        });
        processedLabels += images.length;
        onProgress(processedLabels, labels.length);
      }
    }
    
    const finalImages = results.filter((img): img is Blob => img !== null);
    const elapsed = Date.now() - startTime;
    
    console.log(`\n========== SERVER HD CONVERSION SUMMARY ==========`);
    console.log(`📊 Input: ${labels.length} labels`);
    console.log(`✅ Output: ${finalImages.length} HD images`);
    console.log(`⏱️ Total time: ${(elapsed / 1000).toFixed(1)}s`);
    console.log(`📈 Throughput: ${(labels.length / (elapsed / 1000)).toFixed(1)} labels/sec`);
    console.log(`================================================\n`);
    
    if (finalImages.length < labels.length) {
      console.warn(`⚠️ Lost ${labels.length - finalImages.length} labels during conversion`);
    }
    
    return finalImages;
  };

  return { convertZplToHdImages };
};
