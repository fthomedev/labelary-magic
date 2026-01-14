
import { jsPDF } from 'jspdf';

interface ImageDimensions {
  width: number;
  height: number;
}

// Parallel blob to dataURL conversion with concurrency control
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
  
  // OPTIMIZATION: Pre-convert all blobs to dataURLs in parallel
  const conversionStart = Date.now();
  console.log(`🔄 Converting ${imageBlobs.length} blobs to dataURLs in parallel...`);
  const dataUrls = await blobsToDataURLs(imageBlobs);
  console.log(`✅ Blob conversion completed in ${Date.now() - conversionStart}ms`);
  
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
      
      // Add image to PDF
      pdf.addImage(
        imageDataUrl,
        'PNG',
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
// Uses chunked processing to avoid "Invalid string length" error with large datasets
export const organizeImagesInSeparatePDF = async (imageBlobs: Blob[]): Promise<{ pdfBlob: Blob; labelsAdded: number; failedLabels: number[] }> => {
  console.log(`\n========== HD PDF GENERATION START ==========`);
  console.log(`📄 Input images: ${imageBlobs.length}`);
  
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
  
  // Process images in smaller chunks to avoid memory issues
  // Convert and add one image at a time to prevent "Invalid string length" error
  const CHUNK_SIZE = 20; // Process 20 images at a time
  const totalChunks = Math.ceil(imageBlobs.length / CHUNK_SIZE);
  
  console.log(`📦 Processing in ${totalChunks} chunks of up to ${CHUNK_SIZE} images`);
  
  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const chunkStart = chunkIndex * CHUNK_SIZE;
    const chunkEnd = Math.min(chunkStart + CHUNK_SIZE, imageBlobs.length);
    const chunkBlobs = imageBlobs.slice(chunkStart, chunkEnd);
    
    // Convert this chunk to dataURLs
    const chunkDataUrls = await blobsToDataURLs(chunkBlobs, 5);
    
    for (let i = 0; i < chunkBlobs.length; i++) {
      const globalIndex = chunkStart + i;
      
      // Validate blob before processing
      if (!chunkBlobs[i] || chunkBlobs[i].size === 0) {
        console.error(`🚨 [PDF] Label ${globalIndex + 1}: Invalid/empty blob (size: ${chunkBlobs[i]?.size || 0})`);
        failedLabels.push(globalIndex + 1);
        continue;
      }
      
      // Add new page for each label after the first
      if (labelsAdded > 0) {
        pdf.addPage([labelWidthMM, labelHeightMM]);
      }
      
      try {
        const imageDataUrl = chunkDataUrls[i];
        
        if (!imageDataUrl || !imageDataUrl.startsWith('data:')) {
          console.error(`🚨 [PDF] Label ${globalIndex + 1}: Failed to convert to data URL`);
          failedLabels.push(globalIndex + 1);
          continue;
        }
        
        // Add image to fill the entire page
        pdf.addImage(
          imageDataUrl,
          'PNG',
          0,
          0,
          labelWidthMM,
          labelHeightMM
        );
        
        console.log(`📋 Added label ${globalIndex + 1} to page ${labelsAdded + 1}`);
        labelsAdded++;
        
      } catch (error) {
        console.error(`🚨 [PDF] Label ${globalIndex + 1}: Error adding to PDF:`, error);
        failedLabels.push(globalIndex + 1);
      }
    }
    
    // Log chunk progress
    console.log(`✅ Chunk ${chunkIndex + 1}/${totalChunks} processed (${labelsAdded} labels added so far)`);
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
