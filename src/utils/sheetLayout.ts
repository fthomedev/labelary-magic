
import { SheetConfig } from '@/components/sheet/SheetSettings';

export interface SheetDimensions {
  width: number;
  height: number;
}

export interface LabelLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Dimensões padrão das folhas em mm
export const SHEET_DIMENSIONS: Record<'A4' | 'A5', SheetDimensions> = {
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 }
};

// Dimensões das etiquetas ZPL (4x6 polegadas = ~102x152mm)
// Vamos usar dimensões menores para permitir mais etiquetas por folha
export const LABEL_SIZE = {
  width: 85,  // Reduzido de 102 para permitir mais etiquetas
  height: 120 // Reduzido de 152 para permitir mais etiquetas
};

export const calculateSheetLayout = (
  config: SheetConfig,
  labelCount: number
): LabelLayout[] => {
  console.log('=== CALCULATING SHEET LAYOUT ===');
  console.log('Config:', config);
  console.log('Label count:', labelCount);
  
  const sheet = SHEET_DIMENSIONS[config.sheetSize];
  
  // Área útil da folha (descontando margens)
  const usableWidth = sheet.width - config.marginLeft - config.marginRight;
  const usableHeight = sheet.height - config.marginTop - config.marginBottom;
  
  console.log('Sheet dimensions:', sheet);
  console.log('Usable area:', usableWidth, 'x', usableHeight);
  console.log('Label size:', LABEL_SIZE);
  
  // Quantas etiquetas cabem por linha e coluna
  const labelsPerRow = Math.floor(
    (usableWidth + config.labelSpacing) / (LABEL_SIZE.width + config.labelSpacing)
  );
  const labelsPerColumn = Math.floor(
    (usableHeight + config.labelSpacing) / (LABEL_SIZE.height + config.labelSpacing)
  );
  
  console.log('Labels per row:', labelsPerRow);
  console.log('Labels per column:', labelsPerColumn);
  
  const maxLabelsPerSheet = labelsPerRow * labelsPerColumn;
  const actualLabelCount = Math.min(labelCount, maxLabelsPerSheet);
  
  console.log('Max labels per sheet:', maxLabelsPerSheet);
  console.log('Actual labels to place:', actualLabelCount);
  
  const layouts: LabelLayout[] = [];
  
  for (let i = 0; i < actualLabelCount; i++) {
    const row = Math.floor(i / labelsPerRow);
    const col = i % labelsPerRow;
    
    const x = config.marginLeft + col * (LABEL_SIZE.width + config.labelSpacing);
    const y = config.marginTop + row * (LABEL_SIZE.height + config.labelSpacing);
    
    console.log(`Label ${i + 1} position: (${x}, ${y})`);
    
    layouts.push({
      x,
      y,
      width: LABEL_SIZE.width,
      height: LABEL_SIZE.height
    });
  }
  
  console.log('=== LAYOUT CALCULATION COMPLETED ===');
  console.log('Generated layouts:', layouts.length);
  return layouts;
};

export const getMaxLabelsPerSheet = (config: SheetConfig): number => {
  const sheet = SHEET_DIMENSIONS[config.sheetSize];
  
  const usableWidth = sheet.width - config.marginLeft - config.marginRight;
  const usableHeight = sheet.height - config.marginTop - config.marginBottom;
  
  const labelsPerRow = Math.floor(
    (usableWidth + config.labelSpacing) / (LABEL_SIZE.width + config.labelSpacing)
  );
  const labelsPerColumn = Math.floor(
    (usableHeight + config.labelSpacing) / (LABEL_SIZE.height + config.labelSpacing)
  );
  
  const maxLabels = labelsPerRow * labelsPerColumn;
  console.log('Max labels per sheet calculation:', {
    sheetSize: config.sheetSize,
    usableWidth,
    usableHeight,
    labelsPerRow,
    labelsPerColumn,
    maxLabels
  });
  
  return maxLabels;
};
