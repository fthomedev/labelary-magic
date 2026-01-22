
import React from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, Tag, FileText } from 'lucide-react';

interface HistoryStatsProps {
  totalLabels: number;
  totalConversions: number;
}

export function HistoryStats({ totalLabels, totalConversions }: HistoryStatsProps) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-4 px-4 py-2 bg-muted/30 border-b text-xs">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <BarChart3 className="h-3.5 w-3.5 text-primary" />
        <span className="font-medium">{t('historyStats.summary')}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Tag className="h-3 w-3 text-primary/70" />
          <span>{t('historyStats.totalLabels', { count: totalLabels })}</span>
        </div>
        <span className="text-muted-foreground/50">•</span>
        <div className="flex items-center gap-1">
          <FileText className="h-3 w-3 text-primary/70" />
          <span>{t('historyStats.totalConversions', { count: totalConversions })}</span>
        </div>
      </div>
    </div>
  );
}
