import { jsPDF } from 'jspdf';

// Compress PNG blob to JPEG dataURL using Canvas (white background, no transparency)
const compressPngToJpeg = async (pngBlob: Blob, quality: number = 0.85): Promise<string> => {
  const img = await createImageBitmap(pngBlob);
  try {
    if (typeof OffscreenCanvas !== 'undefined') {
      const canvas = new OffscreenCanvas(img.width, img.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('No 2D context');
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, img.width, img.height);
      ctx.drawImage(img, 0, 0);
      const jpegBlob = await canvas.convertToBlob({ type: 'image/jpeg', quality });
      return await blobToDataURL(jpegBlob);
    }
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No 2D context');
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, img.width, img.height);
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL('image/jpeg', quality);
  } finally {
    img.close?.();
  }
};

// Parallel blob → JPEG dataURL conversion with concurrency control
const blobsToJpegDataURLs = async (
  blobs: Blob[],
  quality: number = 0.85,
  concurrency: number = 8
): Promise<(string | null)[]> => {
  const results: (string | null)[] = new Array(blobs.length).fill(null);
  let index = 0;

  const processNext = async (): Promise<void> => {
    while (index < blobs.length) {
      const currentIndex = index++;
      try {
        if (blobs[currentIndex] && blobs[currentIndex].size > 0) {
          results[currentIndex] = await compressPngToJpeg(blobs[currentIndex], quality);
        }
      } catch (error) {
        console.error(`❌ Failed to compress blob ${currentIndex + 1} to JPEG:`, error);
        try {
          results[currentIndex] = await blobToDataURL(blobs[currentIndex]);
        } catch (fallbackError) {
          console.error(`❌ Fallback PNG dataURL also failed for blob ${currentIndex + 1}:`, fallbackError);
        }
      }
    }
  };

  const workers = Array(Math.min(concurrency, blobs.length)).fill(null).map(() => processNext());
  await Promise.all(workers);

  return results;
};

const detectImageFormat = (dataUrl: string): 'JPEG' | 'PNG' => {
  return dataUrl.startsWith('data:image/png') ? 'PNG' : 'JPEG';
};

// Generate PDF with one label per page (used by HD mode)
export const organizeImagesInSeparatePDF = async (imageBlobs: Blob[]): Promise<{ pdfBlob: Blob; labelsAdded: number; failedLabels: number[] }> => {
  console.log(`\n========== HD PDF GENERATION START ==========`);
  console.log(`📄 Input images: ${imageBlobs.length}`);

  const conversionStart = Date.now();
  console.log(`🔄 Compressing ${imageBlobs.length} PNGs → JPEGs (q=0.82) in parallel...`);
  const dataUrls = await blobsToJpegDataURLs(imageBlobs, 0.82);
  console.log(`✅ JPEG compression completed in ${Date.now() - conversionStart}ms`);

  // Standard label dimensions (4x6 inches)
  const labelWidthMM = 101.6;
  const labelHeightMM = 152.4;

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [labelWidthMM, labelHeightMM],
  });

  let labelsAdded = 0;
  const failedLabels: number[] = [];

  for (let i = 0; i < imageBlobs.length; i++) {
    if (!imageBlobs[i] || imageBlobs[i].size === 0) {
      console.error(`🚨 [PDF] Label ${i + 1}: Invalid/empty blob (size: ${imageBlobs[i]?.size || 0})`);
      failedLabels.push(i + 1);
      continue;
    }

    if (labelsAdded > 0) {
      pdf.addPage([labelWidthMM, labelHeightMM]);
    }

    try {
      const imageDataUrl = dataUrls[i];

      if (!imageDataUrl || !imageDataUrl.startsWith('data:')) {
        console.error(`🚨 [PDF] Label ${i + 1}: Failed to convert to data URL`);
        failedLabels.push(i + 1);
        continue;
      }

      pdf.addImage(
        imageDataUrl,
        detectImageFormat(imageDataUrl),
        0,
        0,
        labelWidthMM,
        labelHeightMM,
        undefined,
        'FAST'
      );

      console.log(`📋 Added label ${i + 1} to page ${labelsAdded + 1}`);
      labelsAdded++;
    } catch (error) {
      console.error(`🚨 [PDF] Label ${i + 1}: Error adding to PDF:`, error);
      failedLabels.push(i + 1);
    }
  }

  const pdfBlob = pdf.output('blob');

  console.log(`\n========== HD PDF GENERATION SUMMARY ==========`);
  console.log(`📊 Input images: ${imageBlobs.length}`);
  console.log(`✅ Labels added to PDF: ${labelsAdded}`);
  console.log(`📄 Pages generated: ${labelsAdded}`);

  if (failedLabels.length > 0) {
    console.error(`🚨 FAILED labels: [${failedLabels.join(', ')}]`);
    console.error(`🚨 LABEL LOSS in PDF generation: ${failedLabels.length} labels!`);
  } else {
    console.log(`✅ All ${imageBlobs.length} labels successfully added`);
  }
  console.log(`================================================\n`);

  return { pdfBlob, labelsAdded, failedLabels };
};

const blobToDataURL = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
