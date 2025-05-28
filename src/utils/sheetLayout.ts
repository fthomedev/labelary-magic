
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

// Dimensões menores para etiquetas em folha (ajustado para caber mais etiquetas)
export const SHEET_LABEL_SIZE = {
  width: 90,  // Reduzido de 102mm para 90mm
  height: 130 // Reduzido de 152mm para 130mm
};

export const calculateSheetLayout = (
  config: SheetConfig,
  labelCount: number
): LabelLayout[] => {
  const sheet = SHEET_DIMENSIONS[config.sheetSize];
  
  // Área útil da folha (descontando margens)
  const usableWidth = sheet.width - config.marginLeft - config.marginRight;
  const usableHeight = sheet.height - config.marginTop - config.marginBottom;
  
  // Quantas etiquetas cabem por linha e coluna usando as dimensões menores
  const labelsPerRow = Math.floor(
    (usableWidth + config.labelSpacing) / (SHEET_LABEL_SIZE.width + config.labelSpacing)
  );
  const labelsPerColumn = Math.floor(
    (usableHeight + config.labelSpacing) / (SHEET_LABEL_SIZE.height + config.labelSpacing)
  );
  
  const maxLabelsPerSheet = labelsPerRow * labelsPerColumn;
  const actualLabelCount = Math.min(labelCount, maxLabelsPerSheet);
  
  const layouts: LabelLayout[] = [];
  
  console.log(`Layout calculation: ${labelsPerRow} per row, ${labelsPerColumn} per column, max ${maxLabelsPerSheet} per sheet`);
  
  for (let i = 0; i < actualLabelCount; i++) {
    const row = Math.floor(i / labelsPerRow);
    const col = i % labelsPerRow;
    
    const x = config.marginLeft + col * (SHEET_LABEL_SIZE.width + config.labelSpacing);
    const y = config.marginTop + row * (SHEET_LABEL_SIZE.height + config.labelSpacing);
    
    console.log(`Label ${i}: position (${x}, ${y})`);
    
    layouts.push({
      x,
      y,
      width: SHEET_LABEL_SIZE.width,
      height: SHEET_LABEL_SIZE.height
    });
  }
  
  return layouts;
};

export const getMaxLabelsPerSheet = (config: SheetConfig): number => {
  const sheet = SHEET_DIMENSIONS[config.sheetSize];
  
  const usableWidth = sheet.width - config.marginLeft - config.marginRight;
  const usableHeight = sheet.height - config.marginTop - config.marginBottom;
  
  const labelsPerRow = Math.floor(
    (usableWidth + config.labelSpacing) / (SHEET_LABEL_SIZE.width + config.labelSpacing)
  );
  const labelsPerColumn = Math.floor(
    (usableHeight + config.labelSpacing) / (SHEET_LABEL_SIZE.height + config.labelSpacing)
  );
  
  return labelsPerRow * labelsPerColumn;
};
