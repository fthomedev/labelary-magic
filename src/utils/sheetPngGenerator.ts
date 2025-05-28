
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
      throw new Error('Nenhum layout calculado para as etiquetas');
    }
    
    // Conversão de mm para pixels (300 DPI para alta qualidade)
    const mmToPixels = (mm: number) => Math.round(mm * 11.811);
    
    const canvasWidth = mmToPixels(sheet.width);
    const canvasHeight = mmToPixels(sheet.height);
    
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
    
    const labelsToProcess = Math.min(pngBlobs.length, layouts.length);
    console.log(`Processing ${labelsToProcess} labels for ${config.sheetSize} sheet`);
    
    // Processar todas as imagens em paralelo
    const imagePromises = pngBlobs.slice(0, labelsToProcess).map(async (pngBlob, i) => {
      const layout = layouts[i];
      
      try {
        const img = new Image();
        const imageUrl = URL.createObjectURL(pngBlob);
        
        return new Promise<{ img: HTMLImageElement; layout: typeof layout; index: number }>((resolve, reject) => {
          img.onload = () => {
            URL.revokeObjectURL(imageUrl);
            resolve({ img, layout, index: i });
          };
          
          img.onerror = (error) => {
            URL.revokeObjectURL(imageUrl);
            reject(new Error(`Falha ao carregar imagem da etiqueta ${i + 1}`));
          };
          
          img.src = imageUrl;
        });
      } catch (error) {
        console.error(`Failed to process label ${i + 1}:`, error);
        throw error;
      }
    });

    // Aguardar carregamento de todas as imagens
    const loadedImages = await Promise.allSettled(imagePromises);
    
    // Desenhar imagens carregadas com sucesso
    let successCount = 0;
    loadedImages.forEach((result) => {
      if (result.status === 'fulfilled') {
        const { img, layout } = result.value;
        
        const x = mmToPixels(layout.x);
        const y = mmToPixels(layout.y);
        const width = mmToPixels(layout.width);
        const height = mmToPixels(layout.height);
        
        ctx.drawImage(img, x, y, width, height);
        successCount++;
      }
    });
    
    console.log(`Successfully placed ${successCount}/${labelsToProcess} labels on sheet`);
    
    // Converter canvas para PNG
    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          console.log(`Sheet generation completed. Final size: ${(blob.size / 1024).toFixed(1)}KB`);
          resolve(blob);
        } else {
          reject(new Error('Falha ao gerar PNG da folha'));
        }
      }, 'image/png', 1.0);
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
      throw new Error('Não foi possível criar contexto do canvas para PDF');
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
          
          pdf.addImage(dataUrl, 'PNG', x, y, finalWidth, finalHeight);
          
          const pdfBlob = pdf.output('blob');
          console.log(`PDF conversion completed. Final size: ${(pdfBlob.size / 1024).toFixed(1)}KB`);
          
          URL.revokeObjectURL(imageUrl);
          resolve(pdfBlob);
        } catch (error) {
          URL.revokeObjectURL(imageUrl);
          reject(error);
        }
      };
      
      img.onerror = (error) => {
        URL.revokeObjectURL(imageUrl);
        reject(new Error('Falha ao carregar imagem para conversão PDF'));
      };
      
      img.src = imageUrl;
    });
  } catch (error) {
    console.error('PNG to PDF conversion failed:', error);
    throw error;
  }
};
