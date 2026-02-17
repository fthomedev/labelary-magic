
import { jsPDF } from 'jspdf';

interface ImageDimensions {
  width: number;
  height: number;
}

// Compress a PNG blob to JPEG via Canvas for smaller PDF file sizes
const compressImageBlob = (blob: Blob, quality: number = 0.85): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      const jpegDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(jpegDataUrl);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for compression'));
    };
    img.src = url;
  });
};

// Parallel blob compression with concurrency control
const compressBlobsToDataURLs = async (blobs: Blob[], quality: number = 0.85, concurrency: number = 10): Promise<(string | null)[]> => {
  const results: (string | null)[] = new Array(blobs.length).fill(null);
  let index = 0;
  
  const processNext = async (): Promise<void> => {
    while (index < blobs.length) {
      const currentIndex = index++;
      try {
        if (blobs[currentIndex] && blobs[currentIndex].size > 0) {
          results[currentIndex] = await compressImageBlob(blobs[currentIndex], quality);
        }
      } catch (error) {
        console.error(`❌ Failed to compress blob ${currentIndex + 1}:`, error);
        // Fallback to uncompressed dataURL
        try {
          results[currentIndex] = await blobToDataURL(blobs[currentIndex]);
        } catch {
          console.error(`❌ Fallback also failed for blob ${currentIndex + 1}`);
        }
      }
    }
  };
  
  const workers = Array(Math.min(concurrency, blobs.length)).fill(null).map(() => processNext());
  await Promise.all(workers);
  
  return results;
};

// Parallel blob to dataURL conversion with concurrency control (kept for fallback)
const blobsToDataURLs = async (blobs: Blob[], concurrency: number = 10): Promise<(string | null)[]> => {
  const results: (string | null)[] = new Array(blobs.length).fill(null);
  let index = 0;
  
  const processNext = async (): Promise<void> => {
    while (index < blobs.length) {
      const currentIndex = index++;
      try {
        if (blobs[currentIndex] && blobs[currentIndex].size > 0) {
          results[currentIndex] = await blobToDataURL(blobs[currentIndex]);
        }
      } catch (error) {
        console.error(`❌ Failed to convert blob ${currentIndex + 1} to dataURL:`, error);
      }
    }
  };
  
  // Start concurrent workers
  const workers = Array(Math.min(concurrency, blobs.length)).fill(null).map(() => processNext());
  await Promise.all(workers);
  
  return results;
};

export const organizeImagesInA4PDF = async (imageBlobs: Blob[]): Promise<{ pdfBlob: Blob; labelsAdded: number; failedLabels: number[] }> => {
  console.log(`\n========== A4 PDF GENERATION START ==========`);
  console.log(`📄 Input images: ${imageBlobs.length}`);
  
  // OPTIMIZATION: Compress PNG to JPEG and convert in parallel
  const conversionStart = Date.now();
  console.log(`🔄 Compressing ${imageBlobs.length} images (PNG→JPEG) in parallel...`);
  const dataUrls = await compressBlobsToDataURLs(imageBlobs);
  console.log(`✅ Image compression completed in ${Date.now() - conversionStart}ms`);
  
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  // A4 dimensions in mm
  const pageWidth = 210;
  const pageHeight = 297;
  
  // Label dimensions (4x6 inches = ~101.6x152.4mm, but we'll scale to fit nicely)
  const labelWidth = 95;
  const labelHeight = 140;
  
  // Margins
  const marginX = (pageWidth - (labelWidth * 2)) / 3; // Space for 2 labels + 3 gaps
  const marginY = (pageHeight - (labelHeight * 2)) / 3; // Space for 2 labels + 3 gaps
  
  // Positions for 4 labels on A4
  const positions = [
    { x: marginX, y: marginY }, // Top left
    { x: marginX + labelWidth + marginX, y: marginY }, // Top right
    { x: marginX, y: marginY + labelHeight + marginY }, // Bottom left
    { x: marginX + labelWidth + marginX, y: marginY + labelHeight + marginY }, // Bottom right
  ];
  
  let currentPage = 0;
  let labelsOnCurrentPage = 0;
  let labelsAdded = 0;
  const failedLabels: number[] = [];
  
  for (let i = 0; i < imageBlobs.length; i++) {
    // Validate blob before processing
    if (!imageBlobs[i] || imageBlobs[i].size === 0) {
      console.error(`🚨 [PDF] Label ${i + 1}: Invalid/empty blob (size: ${imageBlobs[i]?.size || 0})`);
      failedLabels.push(i + 1);
      continue;
    }
    
    // Create new page if needed (except for the first page)
    if (labelsOnCurrentPage === 0 && labelsAdded > 0) {
      pdf.addPage();
      currentPage++;
    }
    
    try {
      // Use pre-converted dataURL
      const imageDataUrl = dataUrls[i];
      
      if (!imageDataUrl || !imageDataUrl.startsWith('data:')) {
        console.error(`🚨 [PDF] Label ${i + 1}: Failed to convert to data URL`);
        failedLabels.push(i + 1);
        continue;
      }
      
      // Get position for current label on page
      const position = positions[labelsOnCurrentPage];
      
      // Add image to PDF (JPEG format from compression)
      const imgFormat = imageDataUrl.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';
      pdf.addImage(
        imageDataUrl,
        imgFormat,
        position.x,
        position.y,
        labelWidth,
        labelHeight
      );
      
      console.log(`📋 Added label ${i + 1} to page ${currentPage + 1} at position ${labelsOnCurrentPage + 1}`);
      
      labelsAdded++;
      labelsOnCurrentPage++;
      
      // Reset counter when page is full
      if (labelsOnCurrentPage === 4) {
        labelsOnCurrentPage = 0;
      }
      
    } catch (error) {
      console.error(`🚨 [PDF] Label ${i + 1}: Error adding to PDF:`, error);
      failedLabels.push(i + 1);
    }
  }
  
  // Generate PDF blob
  const pdfBlob = pdf.output('blob');
  
  console.log(`\n========== A4 PDF GENERATION SUMMARY ==========`);
  console.log(`📊 Input images: ${imageBlobs.length}`);
  console.log(`✅ Labels added to PDF: ${labelsAdded}`);
  console.log(`📄 Pages generated: ${Math.ceil(labelsAdded / 4)}`);
  
  if (failedLabels.length > 0) {
    console.error(`🚨 FAILED labels: [${failedLabels.join(', ')}]`);
    console.error(`🚨 LABEL LOSS in PDF generation: ${failedLabels.length} labels!`);
  } else {
    console.log(`✅ All ${imageBlobs.length} labels successfully added`);
  }
  console.log(`================================================\n`);
  
  return { pdfBlob, labelsAdded, failedLabels };
};

// Generate PDF with one label per page (for HD mode)
export const organizeImagesInSeparatePDF = async (imageBlobs: Blob[]): Promise<{ pdfBlob: Blob; labelsAdded: number; failedLabels: number[] }> => {
  console.log(`\n========== HD PDF GENERATION START ==========`);
  console.log(`📄 Input images: ${imageBlobs.length}`);
  
  // OPTIMIZATION: Compress PNG to JPEG and convert in parallel
  const conversionStart = Date.now();
  console.log(`🔄 Compressing ${imageBlobs.length} images (PNG→JPEG) for HD PDF...`);
  const dataUrls = await compressBlobsToDataURLs(imageBlobs);
  console.log(`✅ Image compression completed in ${Date.now() - conversionStart}ms`);
  
  // Standard label dimensions (4x6 inches)
  const labelWidthMM = 101.6; // 4 inches in mm
  const labelHeightMM = 152.4; // 6 inches in mm
  
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [labelWidthMM, labelHeightMM] // Custom page size matching label
  });
  
  let labelsAdded = 0;
  const failedLabels: number[] = [];
  
  for (let i = 0; i < imageBlobs.length; i++) {
    // Validate blob before processing
    if (!imageBlobs[i] || imageBlobs[i].size === 0) {
      console.error(`🚨 [PDF] Label ${i + 1}: Invalid/empty blob (size: ${imageBlobs[i]?.size || 0})`);
      failedLabels.push(i + 1);
      continue;
    }
    
    // Add new page for each label after the first
    if (labelsAdded > 0) {
      pdf.addPage([labelWidthMM, labelHeightMM]);
    }
    
    try {
      // Use pre-converted dataURL
      const imageDataUrl = dataUrls[i];
      
      if (!imageDataUrl || !imageDataUrl.startsWith('data:')) {
        console.error(`🚨 [PDF] Label ${i + 1}: Failed to convert to data URL`);
        failedLabels.push(i + 1);
        continue;
      }
      
      // Add image to fill the entire page (JPEG format from compression)
      const imgFormat = imageDataUrl.startsWith('data:image/jpeg') ? 'JPEG' : 'PNG';
      pdf.addImage(
        imageDataUrl,
        imgFormat,
        0,
        0,
        labelWidthMM,
        labelHeightMM
      );
      
      console.log(`📋 Added label ${i + 1} to page ${labelsAdded + 1}`);
      labelsAdded++;
      
    } catch (error) {
      console.error(`🚨 [PDF] Label ${i + 1}: Error adding to PDF:`, error);
      failedLabels.push(i + 1);
    }
  }
  
  // Generate PDF blob
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
