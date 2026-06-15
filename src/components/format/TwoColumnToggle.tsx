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
    <div className="rounded-lg border border-border bg-background/50 p-3 max-w-md mx-auto">
      <div className="flex items-center gap-3">
        <Columns2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <Label
          htmlFor="two-column-toggle"
          className="flex-1 text-sm font-medium text-foreground cursor-pointer"
        >
          {t('twoColumnToggle')}
        </Label>
        <Switch
          id="two-column-toggle"
          checked={enabled}
          onCheckedChange={onChange}
          className="flex-shrink-0"
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1.5 pl-7">
        {t('twoColumnHint')}
      </p>
    </div>
  );
}
