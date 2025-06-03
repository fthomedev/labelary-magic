
import { jsPDF } from 'jspdf';

interface ImageDimensions {
  width: number;
  height: number;
}

export const organizeImagesInA4PDF = async (imageBlobs: Blob[]): Promise<Blob> => {
  console.log(`📄 Creating A4 PDF with ${imageBlobs.length} images`);
  
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
  
  for (let i = 0; i < imageBlobs.length; i++) {
    // Create new page if needed (except for the first page)
    if (labelsOnCurrentPage === 0 && i > 0) {
      pdf.addPage();
      currentPage++;
    }
    
    try {
      // Convert blob to data URL
      const imageDataUrl = await blobToDataURL(imageBlobs[i]);
      
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
      
      labelsOnCurrentPage++;
      
      // Reset counter when page is full
      if (labelsOnCurrentPage === 4) {
        labelsOnCurrentPage = 0;
      }
      
    } catch (error) {
      console.error(`Error adding image ${i + 1} to PDF:`, error);
    }
  }
  
  // Generate PDF blob
  const pdfBlob = pdf.output('blob');
  console.log(`📄 A4 PDF generated with ${Math.ceil(imageBlobs.length / 4)} pages`);
  
  return pdfBlob;
};

const blobToDataURL = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
