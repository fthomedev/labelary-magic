
import { SheetConfig } from '@/components/sheet/SheetSettings';
import { calculateSheetLayout, SHEET_DIMENSIONS } from './sheetLayout';
import { jsPDF } from 'jspdf';

export const generateSheetFromPngs = async (
  pngBlobs: Blob[],
  config: SheetConfig
): Promise<Blob> => {
  console.log(`Starting sheet generation for ${pngBlobs.length} labels`);
  
  try {
    const layouts = calculateSheetLayout(config, pngBlobs.length);
    const sheet = SHEET_DIMENSIONS[config.sheetSize];
    
    if (layouts.length === 0) {
      throw new Error('No layout calculated for labels');
    }
    
    const mmToPixels = (mm: number) => Math.round(mm * 11.811);
    
    const canvasWidth = mmToPixels(sheet.width);
    const canvasHeight = mmToPixels(sheet.height);
    
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not create canvas context');
    }
    
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    const labelsToProcess = Math.min(pngBlobs.length, layouts.length);
    console.log(`Processing ${labelsToProcess} labels for ${config.sheetSize} sheet`);
    
    // Carregar todas as imagens em paralelo com Promise.allSettled para melhor controle
    const imagePromises = pngBlobs.slice(0, labelsToProcess).map(async (pngBlob, i) => {
      const layout = layouts[i];
      
      try {
        const img = new Image();
        const imageUrl = URL.createObjectURL(pngBlob);
        
        return new Promise<{ img: HTMLImageElement; layout: typeof layout; index: number }>((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            URL.revokeObjectURL(imageUrl);
            reject(new Error(`Timeout loading image ${i + 1}`));
          }, 5000); // 5 segundos de timeout por imagem

          img.onload = () => {
            clearTimeout(timeoutId);
            URL.revokeObjectURL(imageUrl);
            resolve({ img, layout, index: i });
          };
          
          img.onerror = () => {
            clearTimeout(timeoutId);
            URL.revokeObjectURL(imageUrl);
            reject(new Error(`Failed to load image ${i + 1}`));
          };
          
          img.src = imageUrl;
        });
      } catch (error) {
        console.error(`Failed to process label ${i + 1}:`, error);
        throw error;
      }
    });

    const loadedImages = await Promise.allSettled(imagePromises);
    
    let successCount = 0;
    loadedImages.forEach((result) => {
      if (result.status === 'fulfilled') {
        const { img, layout } = result.value;
        
        const x = mmToPixels(layout.x);
        const y = mmToPixels(layout.y);
        const width = mmToPixels(layout.width);
        const height = mmToPixels(layout.height);
        
        try {
          ctx.drawImage(img, x, y, width, height);
          successCount++;
        } catch (drawError) {
          console.error(`Error drawing image ${result.value.index + 1}:`, drawError);
        }
      } else {
        console.error('Failed to load image:', result.reason);
      }
    });
    
    console.log(`Successfully placed ${successCount}/${labelsToProcess} labels on sheet`);
    
    return new Promise((resolve, reject) => {
      try {
        canvas.toBlob((blob) => {
          if (blob) {
            console.log(`Sheet generation completed. Final size: ${(blob.size / 1024).toFixed(1)}KB`);
            resolve(blob);
          } else {
            reject(new Error('Failed to generate sheet PNG'));
          }
        }, 'image/png', 1.0);
      } catch (error) {
        reject(new Error(`Canvas conversion failed: ${error.message}`));
      }
    });
  } catch (error) {
    console.error('Sheet generation error:', error);
    throw error;
  }
};

export const convertPngToPdf = async (pngBlob: Blob): Promise<Blob> => {
  console.log(`Converting sheet PNG to PDF (${(pngBlob.size / 1024).toFixed(1)}KB)`);
  
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Could not create canvas context for PDF');
    }
    
    const img = new Image();
    const imageUrl = URL.createObjectURL(pngBlob);
    
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        URL.revokeObjectURL(imageUrl);
        reject(new Error('Timeout converting PNG to PDF'));
      }, 10000);

      img.onload = () => {
        try {
          clearTimeout(timeoutId);
          
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          const dataUrl = canvas.toDataURL('image/png');
          
          const pageWidth = 210;
          const pageHeight = 297;
          const margin = 5;
          
          const maxWidth = pageWidth - (margin * 2);
          const maxHeight = pageHeight - (margin * 2);
          
          const imgRatio = img.width / img.height;
          let finalWidth = maxWidth;
          let finalHeight = maxWidth / imgRatio;
          
          if (finalHeight > maxHeight) {
            finalHeight = maxHeight;
            finalWidth = maxHeight * imgRatio;
          }
          
          const x = (pageWidth - finalWidth) / 2;
          const y = (pageHeight - finalHeight) / 2;
          
          pdf.addImage(dataUrl, 'PNG', x, y, finalWidth, finalHeight);
          
          const pdfBlob = pdf.output('blob');
          console.log(`PDF conversion completed. Final size: ${(pdfBlob.size / 1024).toFixed(1)}KB`);
          
          URL.revokeObjectURL(imageUrl);
          resolve(pdfBlob);
        } catch (error) {
          clearTimeout(timeoutId);
          URL.revokeObjectURL(imageUrl);
          reject(new Error(`PDF generation failed: ${error.message}`));
        }
      };
      
      img.onerror = () => {
        clearTimeout(timeoutId);
        URL.revokeObjectURL(imageUrl);
        reject(new Error('Failed to load image for PDF conversion'));
      };
      
      img.src = imageUrl;
    });
  } catch (error) {
    console.error('PNG to PDF conversion failed:', error);
    throw error;
  }
};
