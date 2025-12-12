import { splitZPLIntoBlocks, mergePDFs, delay } from '@/utils/pdfUtils';

const A4_BATCH_SIZE = 50; // Labelary max labels per request
const BATCH_DELAY_MS = 400; // Delay between batches to avoid rate limits

export const useA4DirectConversion = () => {
  
  const convertZplToA4PDFDirect = async (
    zplContent: string,
    onProgress: (progress: number) => void
  ): Promise<{ pdfBlob: Blob; labelCount: number }> => {
    console.log('\n========== A4 DIRECT CONVERSION (NO UPSCALING) ==========');
    
    const labels = splitZPLIntoBlocks(zplContent);
    const labelCount = labels.length;
    
    console.log(`📊 Total labels to convert: ${labelCount}`);
    
    if (labelCount === 0) {
      throw new Error('No valid ZPL labels found');
    }
    
    // Split into batches of max 50 labels
    const batches: string[][] = [];
    for (let i = 0; i < labels.length; i += A4_BATCH_SIZE) {
      batches.push(labels.slice(i, i + A4_BATCH_SIZE));
    }
    
    console.log(`📦 Split into ${batches.length} batch(es)`);
    
    const pdfBlobs: Blob[] = [];
    let processedLabels = 0;
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const batchZpl = batch.join('\n');
      
      console.log(`\n🔄 Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} labels)`);
      
      // Add delay between batches (except first)
      if (batchIndex > 0) {
        console.log(`⏳ Waiting ${BATCH_DELAY_MS}ms before next batch...`);
        await delay(BATCH_DELAY_MS);
      }
      
      const pdfBlob = await fetchA4PDFFromLabelary(batchZpl, batch.length);
      
      if (pdfBlob) {
        pdfBlobs.push(pdfBlob);
        processedLabels += batch.length;
        
        // Update progress (0-90%)
        const progress = Math.round((processedLabels / labelCount) * 90);
        onProgress(progress);
        console.log(`✅ Batch ${batchIndex + 1} complete - Progress: ${progress}%`);
      } else {
        console.error(`❌ Batch ${batchIndex + 1} failed`);
        throw new Error(`Failed to convert batch ${batchIndex + 1}`);
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
  
  const fetchA4PDFFromLabelary = async (
    zplContent: string,
    labelCount: number,
    retries: number = 3
  ): Promise<Blob | null> => {
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
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`❌ Labelary error: ${response.status} ${response.statusText}`);
          console.error(`❌ Error body: ${errorText}`);
          console.error(`❌ ZPL content (first 500 chars): ${zplContent.substring(0, 500)}`);
          if (attempt < retries) {
            await delay(1000 * attempt);
            continue;
          }
          return null;
        }
        
        const blob = await response.blob();
        console.log(`✅ Received PDF: ${(blob.size / 1024).toFixed(1)}KB`);
        return blob;
        
      } catch (error) {
        console.error(`❌ Request error (attempt ${attempt}):`, error);
        if (attempt < retries) {
          await delay(1000 * attempt);
          continue;
        }
        return null;
      }
    }
    
    return null;
  };
  
  return {
    convertZplToA4PDFDirect
  };
};
