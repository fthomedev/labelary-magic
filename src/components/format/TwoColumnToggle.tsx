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
    <div className="w-full rounded-lg border border-border bg-background/50 p-3">
      <div className="flex w-full items-center gap-3">
        <Columns2 className="h-4 w-4 shrink-0 text-muted-foreground" />
        <Label
          htmlFor="two-column-toggle"
          className="min-w-0 flex-1 text-sm font-medium text-foreground cursor-pointer"
        >
          {t('twoColumnToggle')}
        </Label>
        <Switch
          id="two-column-toggle"
          checked={enabled}
          onCheckedChange={onChange}
          className="shrink-0"
        />
      </div>
      <p className="mt-1.5 pl-7 text-xs text-muted-foreground">
        {t('twoColumnHint')}
      </p>
    </div>
  );
}
