
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Printer } from 'lucide-react';
import { getMaxLabelsPerSheet } from '@/utils/sheetLayout';

export interface SheetConfig {
  enabled: boolean;
  sheetSize: 'A4' | 'A5';
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  labelSpacing: number;
}

interface SheetSettingsProps {
  config: SheetConfig;
  onChange: (config: SheetConfig) => void;
}

export function SheetSettings({ config, onChange }: SheetSettingsProps) {
  const { t } = useTranslation();

  const updateConfig = (updates: Partial<SheetConfig>) => {
    onChange({ ...config, ...updates });
  };

  // Calcular quantas etiquetas cabem na configuração atual
  const maxLabels = getMaxLabelsPerSheet(config);

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Printer className="h-4 w-4" />
          {t('sheetPrintingSettings')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="sheet-enabled"
            checked={config.enabled}
            onCheckedChange={(enabled) => updateConfig({ enabled })}
          />
          <Label htmlFor="sheet-enabled" className="text-sm">
            {t('combineLabelsInSheet')}
          </Label>
        </div>

        {config.enabled && (
          <div className="space-y-3 pl-6 border-l-2 border-gray-100">
            <div className="text-xs bg-blue-50 p-2 rounded border">
              <strong>Capacidade:</strong> {maxLabels} etiquetas por folha {config.sheetSize}
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-600">{t('sheetSize')}</Label>
                <Select
                  value={config.sheetSize}
                  onValueChange={(sheetSize: 'A4' | 'A5') => updateConfig({ sheetSize })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4 (210×297mm)</SelectItem>
                    <SelectItem value="A5">A5 (148×210mm)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-xs text-gray-600">{t('labelSpacing')}</Label>
                <Input
                  type="number"
                  min="0"
                  max="20"
                  value={config.labelSpacing}
                  onChange={(e) => updateConfig({ labelSpacing: Number(e.target.value) })}
                  className="h-8"
                  placeholder="mm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-600">{t('marginTop')}</Label>
                <Input
                  type="number"
                  min="0"
                  max="50"
                  value={config.marginTop}
                  onChange={(e) => updateConfig({ marginTop: Number(e.target.value) })}
                  className="h-8"
                  placeholder="mm"
                />
              </div>
              
              <div>
                <Label className="text-xs text-gray-600">{t('marginBottom')}</Label>
                <Input
                  type="number"
                  min="0"
                  max="50"
                  value={config.marginBottom}
                  onChange={(e) => updateConfig({ marginBottom: Number(e.target.value) })}
                  className="h-8"
                  placeholder="mm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-gray-600">{t('marginLeft')}</Label>
                <Input
                  type="number"
                  min="0"
                  max="50"
                  value={config.marginLeft}
                  onChange={(e) => updateConfig({ marginLeft: Number(e.target.value) })}
                  className="h-8"
                  placeholder="mm"
                />
              </div>
              
              <div>
                <Label className="text-xs text-gray-600">{t('marginRight')}</Label>
                <Input
                  type="number"
                  min="0"
                  max="50"
                  value={config.marginRight}
                  onChange={(e) => updateConfig({ marginRight: Number(e.target.value) })}
                  className="h-8"
                  placeholder="mm"
                />
              </div>
            </div>

            <div className="text-xs text-gray-500 mt-2">
              {t('sheetPrintingDescription')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
