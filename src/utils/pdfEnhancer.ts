import { PDFDocument } from 'pdf-lib';

/**
 * Combines multiple PDF blobs into a single PDF using pdf-lib
 * This preserves vector quality for text, barcodes, and QR codes
 */
export const combineVectorPdfs = async (pdfBlobs: Blob[]): Promise<Blob> => {
  console.log(`📄 Combining ${pdfBlobs.length} vector PDFs with pdf-lib`);
  
  const mergedPdf = await PDFDocument.create();
  
  for (let i = 0; i < pdfBlobs.length; i++) {
    try {
      const pdfBytes = await pdfBlobs[i].arrayBuffer();
      const sourcePdf = await PDFDocument.load(pdfBytes);
      const pageCount = sourcePdf.getPageCount();
      
      // Copy all pages from source PDF
      const copiedPages = await mergedPdf.copyPages(sourcePdf, Array.from({ length: pageCount }, (_, j) => j));
      copiedPages.forEach(page => mergedPdf.addPage(page));
      
      console.log(`✅ Added PDF ${i + 1} (${pageCount} pages)`);
    } catch (error) {
      console.error(`❌ Error processing PDF ${i + 1}:`, error);
    }
  }
  
  const mergedBytes = await mergedPdf.save();
  console.log(`📄 Combined PDF: ${mergedPdf.getPageCount()} total pages`);
  
  return new Blob([new Uint8Array(mergedBytes).buffer], { type: 'application/pdf' });
};

/**
 * Organizes vector PDFs into A4 format with 4 labels per page
 * Uses pdf-lib to preserve vector quality for barcodes and text
 */
export const organizeVectorPdfsInA4 = async (pdfBlobs: Blob[]): Promise<Blob> => {
  console.log(`📄 Creating A4 PDF with ${pdfBlobs.length} vector labels`);
  
  const a4Pdf = await PDFDocument.create();
  
  // A4 dimensions in points (72 points per inch)
  const A4_WIDTH = 595.28;  // 210mm
  const A4_HEIGHT = 841.89; // 297mm
  
  // Label dimensions (4x6 inches = 288x432 points at 72dpi)
  // Scale down to fit 4 labels per page
  const LABEL_WIDTH = 269;  // ~95mm
  const LABEL_HEIGHT = 397; // ~140mm
  
  // Margins and spacing
  const MARGIN_X = (A4_WIDTH - (LABEL_WIDTH * 2)) / 3;
  const MARGIN_Y = (A4_HEIGHT - (LABEL_HEIGHT * 2)) / 3;
  
  // Positions for 4 labels on A4 (in PDF coordinate system, origin is bottom-left)
  const positions = [
    { x: MARGIN_X, y: A4_HEIGHT - MARGIN_Y - LABEL_HEIGHT }, // Top left
    { x: MARGIN_X + LABEL_WIDTH + MARGIN_X, y: A4_HEIGHT - MARGIN_Y - LABEL_HEIGHT }, // Top right
    { x: MARGIN_X, y: MARGIN_Y }, // Bottom left
    { x: MARGIN_X + LABEL_WIDTH + MARGIN_X, y: MARGIN_Y }, // Bottom right
  ];
  
  let currentPageIndex = -1;
  let labelsOnCurrentPage = 0;
  let currentPage: ReturnType<typeof a4Pdf.addPage> | null = null;
  
  for (let i = 0; i < pdfBlobs.length; i++) {
    // Create new page when needed
    if (labelsOnCurrentPage === 0) {
      currentPage = a4Pdf.addPage([A4_WIDTH, A4_HEIGHT]);
      currentPageIndex++;
      console.log(`📄 Created A4 page ${currentPageIndex + 1}`);
    }
    
    try {
      const pdfBytes = await pdfBlobs[i].arrayBuffer();
      const sourcePdf = await PDFDocument.load(pdfBytes);
      
      // Get the first page of the source PDF (each label is a single PDF)
      const [embeddedPage] = await a4Pdf.embedPdf(sourcePdf, [0]);
      
      // Get original dimensions - size is a method that returns { width, height }
      const originalDims = embeddedPage.size();
      
      // Calculate scale to fit in label area while maintaining aspect ratio
      const scaleX = LABEL_WIDTH / originalDims.width;
      const scaleY = LABEL_HEIGHT / originalDims.height;
      const scale = Math.min(scaleX, scaleY);
      
      const scaledWidth = originalDims.width * scale;
      const scaledHeight = originalDims.height * scale;
      
      // Center the label in its position
      const position = positions[labelsOnCurrentPage];
      const offsetX = (LABEL_WIDTH - scaledWidth) / 2;
      const offsetY = (LABEL_HEIGHT - scaledHeight) / 2;
      
      // Draw the embedded PDF page
      currentPage!.drawPage(embeddedPage, {
        x: position.x + offsetX,
        y: position.y + offsetY,
        width: scaledWidth,
        height: scaledHeight,
      });
      
      console.log(`📋 Added label ${i + 1} to page ${currentPageIndex + 1} at position ${labelsOnCurrentPage + 1}`);
      
      labelsOnCurrentPage++;
      
      // Reset counter when page is full
      if (labelsOnCurrentPage === 4) {
        labelsOnCurrentPage = 0;
      }
      
    } catch (error) {
      console.error(`❌ Error embedding PDF ${i + 1}:`, error);
    }
  }
  
  const pdfBytes = await a4Pdf.save();
  console.log(`📄 A4 PDF generated with ${a4Pdf.getPageCount()} pages (vector quality preserved)`);
  
  return new Blob([new Uint8Array(pdfBytes).buffer], { type: 'application/pdf' });
};

/**
 * Converts ZPL labels to individual vector PDFs via Labelary at 12dpmm (300 DPI)
 * Returns array of PDF blobs with maximum vector quality
 */
export const convertZplToVectorPdf = async (
  zplContent: string,
  onProgress?: (progress: number) => void
): Promise<Blob> => {
  const response = await fetch('https://api.labelary.com/v1/printers/12dpmm/labels/4x6/', {
    method: 'POST',
    headers: {
      'Accept': 'application/pdf',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: zplContent,
  });

  if (!response.ok) {
    throw new Error(`Labelary API error: ${response.status}`);
  }

  return await response.blob();
};
