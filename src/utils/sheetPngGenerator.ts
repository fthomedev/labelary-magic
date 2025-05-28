
import { SheetConfig } from '@/components/sheet/SheetSettings';
import { calculateSheetLayout, SHEET_DIMENSIONS } from './sheetLayout';
import { jsPDF } from 'jspdf';

export const generateSheetFromPngs = async (
  pngBlobs: Blob[],
  config: SheetConfig
): Promise<Blob> => {
  console.log('=== STARTING SHEET GENERATION ===');
  console.log('PNG count:', pngBlobs.length);
  console.log('Config:', config);
  
  try {
    const layouts = calculateSheetLayout(config, pngBlobs.length);
    const sheet = SHEET_DIMENSIONS[config.sheetSize];
    
    console.log('Calculated layouts:', layouts.length);
    console.log('Sheet dimensions:', sheet);
    
    if (layouts.length === 0) {
      throw new Error('Nenhum layout calculado para as etiquetas');
    }
    
    // Conversão de mm para pixels (300 DPI para alta qualidade)
    const mmToPixels = (mm: number) => Math.round(mm * 11.811);
    
    const canvasWidth = mmToPixels(sheet.width);
    const canvasHeight = mmToPixels(sheet.height);
    
    console.log('Canvas dimensions (pixels):', canvasWidth, 'x', canvasHeight);
    
    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Não foi possível criar contexto do canvas');
    }
    
    // Fundo branco
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);
    
    console.log('Processing', Math.min(pngBlobs.length, layouts.length), 'labels for sheet');
    
    // Processar cada PNG
    const labelsToProcess = Math.min(pngBlobs.length, layouts.length);
    
    for (let i = 0; i < labelsToProcess; i++) {
      const layout = layouts[i];
      const pngBlob = pngBlobs[i];
      
      console.log(`Processing label ${i + 1}/${labelsToProcess}:`, {
        layoutPosition: `(${layout.x}, ${layout.y})`,
        layoutSize: `${layout.width}x${layout.height}mm`,
        blobSize: pngBlob.size
      });
      
      try {
        const img = new Image();
        const imageUrl = URL.createObjectURL(pngBlob);
        
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            try {
              const x = mmToPixels(layout.x);
              const y = mmToPixels(layout.y);
              const width = mmToPixels(layout.width);
              const height = mmToPixels(layout.height);
              
              console.log(`Drawing label ${i + 1}:`, { 
                pixelPos: `(${x}, ${y})`,
                pixelSize: `${width}x${height}`,
                imageNaturalSize: `${img.naturalWidth}x${img.naturalHeight}`
              });
              
              // Desenhar a imagem mantendo a proporção
              ctx.drawImage(img, x, y, width, height);
              URL.revokeObjectURL(imageUrl);
              console.log(`Successfully drew label ${i + 1}`);
              resolve();
            } catch (error) {
              console.error(`Error drawing label ${i + 1}:`, error);
              URL.revokeObjectURL(imageUrl);
              reject(error);
            }
          };
          
          img.onerror = (error) => {
            console.error(`Error loading image ${i + 1}:`, error);
            URL.revokeObjectURL(imageUrl);
            reject(new Error(`Falha ao carregar imagem da etiqueta ${i + 1}`));
          };
          
          img.src = imageUrl;
        });
      } catch (error) {
        console.error(`Failed to process label ${i + 1}:`, error);
        // Continue com as outras etiquetas mesmo se uma falhar
      }
    }
    
    console.log('All labels processed, converting canvas to blob');
    
    // Converter canvas para PNG
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          console.log('=== SHEET GENERATION COMPLETED ===');
          console.log('Final blob size:', blob.size, 'bytes');
          console.log('Labels successfully placed on sheet:', labelsToProcess);
          resolve(blob);
        } else {
          console.error('=== SHEET GENERATION FAILED ===');
          reject(new Error('Falha ao gerar PNG da folha'));
        }
      }, 'image/png', 1.0);
    });
  } catch (error) {
    console.error('=== SHEET GENERATION ERROR ===', error);
    throw error;
  }
};

export const convertPngToPdf = async (pngBlob: Blob): Promise<Blob> => {
  console.log('=== STARTING PNG TO PDF CONVERSION ===');
  console.log('PNG size:', pngBlob.size, 'bytes');
  
  try {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Não foi possível criar contexto do canvas para PDF');
    }
    
    const img = new Image();
    const imageUrl = URL.createObjectURL(pngBlob);
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        try {
          console.log('Image loaded for PDF conversion:', img.width, 'x', img.height);
          
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          const dataUrl = canvas.toDataURL('image/png');
          console.log('Data URL created, length:', dataUrl.length);
          
          // Dimensões A4
          const pageWidth = 210;
          const pageHeight = 297;
          const margin = 5;
          
          const maxWidth = pageWidth - (margin * 2);
          const maxHeight = pageHeight - (margin * 2);
          
          // Manter proporção
          const imgRatio = img.width / img.height;
          let finalWidth = maxWidth;
          let finalHeight = maxWidth / imgRatio;
          
          if (finalHeight > maxHeight) {
            finalHeight = maxHeight;
            finalWidth = maxHeight * imgRatio;
          }
          
          // Centralizar
          const x = (pageWidth - finalWidth) / 2;
          const y = (pageHeight - finalHeight) / 2;
          
          console.log('Adding image to PDF:', { x, y, finalWidth, finalHeight });
          
          pdf.addImage(dataUrl, 'PNG', x, y, finalWidth, finalHeight);
          
          const pdfBlob = pdf.output('blob');
          console.log('=== PDF CONVERSION COMPLETED ===');
          console.log('PDF size:', pdfBlob.size, 'bytes');
          
          URL.revokeObjectURL(imageUrl);
          resolve(pdfBlob);
        } catch (error) {
          console.error('=== PDF CONVERSION ERROR ===', error);
          URL.revokeObjectURL(imageUrl);
          reject(error);
        }
      };
      
      img.onerror = (error) => {
        console.error('=== IMAGE LOAD ERROR FOR PDF ===', error);
        URL.revokeObjectURL(imageUrl);
        reject(new Error('Falha ao carregar imagem para conversão PDF'));
      };
      
      img.src = imageUrl;
    });
  } catch (error) {
    console.error('=== PNG TO PDF CONVERSION FAILED ===', error);
    throw error;
  }
};
