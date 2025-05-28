
import { SheetConfig } from '@/components/sheet/SheetSettings';
import { calculateSheetLayout, SHEET_DIMENSIONS } from './sheetLayout';
import { jsPDF } from 'jspdf';

export const generateSheetFromPngs = async (
  pngBlobs: Blob[],
  config: SheetConfig
): Promise<Blob> => {
  console.log('Generating sheet from PNGs, count:', pngBlobs.length, 'config:', config);
  
  const layouts = calculateSheetLayout(config, pngBlobs.length);
  const sheet = SHEET_DIMENSIONS[config.sheetSize];
  
  // Conversão de mm para pixels (assumindo 300 DPI para impressão)
  const mmToPixels = (mm: number) => Math.round(mm * 11.811); // 300 DPI = 11.811 pixels/mm
  
  const canvasWidth = mmToPixels(sheet.width);
  const canvasHeight = mmToPixels(sheet.height);
  
  console.log('Canvas dimensions:', canvasWidth, 'x', canvasHeight);
  
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
  
  // Carregar e posicionar cada PNG
  for (let i = 0; i < Math.min(pngBlobs.length, layouts.length); i++) {
    const layout = layouts[i];
    const pngBlob = pngBlobs[i];
    
    console.log(`Processing label ${i + 1}, layout:`, layout);
    
    const img = new Image();
    const imageUrl = URL.createObjectURL(pngBlob);
    
    await new Promise<void>((resolve, reject) => {
      img.onload = () => {
        try {
          const x = mmToPixels(layout.x);
          const y = mmToPixels(layout.y);
          const width = mmToPixels(layout.width);
          const height = mmToPixels(layout.height);
          
          console.log(`Drawing label ${i + 1} at position:`, { x, y, width, height });
          ctx.drawImage(img, x, y, width, height);
          URL.revokeObjectURL(imageUrl);
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
        reject(error);
      };
      img.src = imageUrl;
    });
  }
  
  console.log('Sheet generation completed, converting to blob');
  
  // Converter canvas para PNG
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        console.log('Sheet PNG generated, size:', blob.size, 'bytes');
        resolve(blob);
      } else {
        reject(new Error('Falha ao gerar PNG da folha'));
      }
    }, 'image/png', 1.0);
  });
};

export const convertPngToPdf = async (pngBlob: Blob): Promise<Blob> => {
  console.log('Converting PNG to PDF, PNG size:', pngBlob.size, 'bytes');
  
  try {
    // Criar um PDF usando jsPDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Converter PNG blob para data URL
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Não foi possível criar contexto do canvas');
    }
    
    const img = new Image();
    const imageUrl = URL.createObjectURL(pngBlob);
    
    return new Promise((resolve, reject) => {
      img.onload = () => {
        try {
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0);
          
          const dataUrl = canvas.toDataURL('image/png');
          
          // Calcular dimensões para caber na página A4
          const pageWidth = 210; // A4 width in mm
          const pageHeight = 297; // A4 height in mm
          const margin = 10;
          
          const maxWidth = pageWidth - (margin * 2);
          const maxHeight = pageHeight - (margin * 2);
          
          // Manter proporção da imagem
          const imgRatio = img.width / img.height;
          let finalWidth = maxWidth;
          let finalHeight = maxWidth / imgRatio;
          
          if (finalHeight > maxHeight) {
            finalHeight = maxHeight;
            finalWidth = maxHeight * imgRatio;
          }
          
          // Centralizar na página
          const x = (pageWidth - finalWidth) / 2;
          const y = (pageHeight - finalHeight) / 2;
          
          console.log('Adding image to PDF:', { x, y, finalWidth, finalHeight });
          
          pdf.addImage(dataUrl, 'PNG', x, y, finalWidth, finalHeight);
          
          const pdfBlob = pdf.output('blob');
          console.log('PDF generated, size:', pdfBlob.size, 'bytes');
          
          URL.revokeObjectURL(imageUrl);
          resolve(pdfBlob);
        } catch (error) {
          console.error('Error converting PNG to PDF:', error);
          URL.revokeObjectURL(imageUrl);
          reject(error);
        }
      };
      
      img.onerror = (error) => {
        console.error('Error loading PNG for PDF conversion:', error);
        URL.revokeObjectURL(imageUrl);
        reject(error);
      };
      
      img.src = imageUrl;
    });
  } catch (error) {
    console.error('Error in convertPngToPdf:', error);
    throw error;
  }
};
