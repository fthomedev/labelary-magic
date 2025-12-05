
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { FileText, Grid3X3, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type PrintFormat = 'standard' | 'a4';

interface FormatSelectorProps {
  selectedFormat: PrintFormat;
  onFormatChange: (format: PrintFormat) => void;
  enhanceLabels?: boolean;
  onEnhanceLabelsChange?: (enhance: boolean) => void;
}

export function FormatSelector({ 
  selectedFormat, 
  onFormatChange,
  enhanceLabels = false,
  onEnhanceLabelsChange
}: FormatSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      <div className="text-center">
        <h4 className="text-sm font-medium text-foreground mb-1">
          {t('printFormat')}
        </h4>
      </div>

      <RadioGroup 
        value={selectedFormat} 
        onValueChange={onFormatChange}
        className="flex items-center justify-center gap-6"
      >
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="standard" id="standard" />
          <Label htmlFor="standard" className="flex items-center gap-2 text-sm cursor-pointer">
            <FileText className="h-4 w-4" />
            {t('standardFormat')}
          </Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="a4" id="a4" />
          <Label htmlFor="a4" className="flex items-center gap-2 text-sm cursor-pointer">
            <Grid3X3 className="h-4 w-4" />
            {t('a4Format')}
          </Label>
        </div>
      </RadioGroup>

      {/* Enhance Labels toggle - only show for A4 format */}
      {selectedFormat === 'a4' && onEnhanceLabelsChange && (
        <div className="flex items-center justify-center gap-2 pt-2 border-t border-border/50">
          <Switch
            id="enhance-labels"
            checked={enhanceLabels}
            onCheckedChange={onEnhanceLabelsChange}
          />
          <Label 
            htmlFor="enhance-labels" 
            className="flex items-center gap-2 text-sm cursor-pointer text-muted-foreground"
          >
            <Sparkles className={`h-4 w-4 ${enhanceLabels ? 'text-primary' : ''}`} />
            {t('enhanceLabels')}
          </Label>
        </div>
      )}
    </div>
  );
}
