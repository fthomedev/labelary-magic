import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Columns2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TwoColumnToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export function TwoColumnToggle({ enabled, onChange }: TwoColumnToggleProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-background/50 p-3 max-w-md mx-auto">
      <Columns2 className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="two-column-toggle" className="text-sm font-medium text-foreground cursor-pointer">
            {t('twoColumnToggle')}
          </Label>
          <Switch
            id="two-column-toggle"
            checked={enabled}
            onCheckedChange={onChange}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {t('twoColumnHint')}
        </p>
      </div>
    </div>
  );
}
