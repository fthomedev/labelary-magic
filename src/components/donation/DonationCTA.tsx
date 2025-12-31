import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Heart, Clock, TrendingUp, Users, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AnimatedCounter } from './AnimatedCounter';
import { useProjectMetrics } from '@/hooks/useProjectMetrics';
import { DonationButton } from '@/components/DonationButton';

interface DonationCTAProps {
  labelsProcessed: number;
  onDonate?: () => void;
}

const PRICE_PER_LABEL = 0.25; // R$ 0.25 per label (market average)

export const DonationCTA: React.FC<DonationCTAProps> = ({
  labelsProcessed,
}) => {
  const { t } = useTranslation();
  const metrics = useProjectMetrics(true); // Force refresh after conversion

  const estimatedSavings = useMemo(() => {
    return (labelsProcessed * PRICE_PER_LABEL).toFixed(2);
  }, [labelsProcessed]);

  const timeSinceUpdate = useMemo(() => {
    const diffMs = Date.now() - metrics.lastUpdated.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) {
      return t('metrics.updatedNow');
    }
    return t('metrics.updatedAgo', { minutes: diffMins });
  }, [metrics.lastUpdated, t]);

  return (
    <div className="space-y-4 p-4 rounded-lg bg-gradient-to-br from-emerald-500/10 via-green-500/5 to-transparent border border-emerald-500/20">
      {/* Personal savings highlight */}
      <div className="text-center space-y-1">
        <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400">
          <span className="text-lg">🎉</span>
          <span className="font-medium">
            {t('metrics.youSaved')} R$ {estimatedSavings}!
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          {t('metrics.estimatedSavings')}
        </p>
      </div>

      {/* Donation button */}
      <div className="flex justify-center">
        <DonationButton variant="success" />
      </div>

      {/* Live metrics */}
      <div className="space-y-2 pt-2 border-t border-border/50">
        {/* Today's stats */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
            <span>{t('metrics.today')}:</span>
            <AnimatedCounter 
              value={metrics.labelsToday} 
              className="font-medium text-foreground" 
            />
            <span>{t('metrics.labels')}</span>
          </div>
          <span className="text-border">·</span>
          <div className="flex items-center gap-1">
            <AnimatedCounter 
              value={metrics.conversionsToday} 
              className="font-medium text-foreground" 
            />
            <span>{t('metrics.conversions')}</span>
          </div>
        </div>

        {/* Global stats */}
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5 text-emerald-500" />
            <span>{t('metrics.total')}:</span>
            <AnimatedCounter 
              value={metrics.totalLabels} 
              className="font-medium text-foreground" 
            />
            <span>{t('metrics.labels')}</span>
          </div>
          <span className="text-border">·</span>
          <div className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5 text-purple-500" />
            <AnimatedCounter 
              value={metrics.uniqueUsers} 
              className="font-medium text-foreground" 
            />
            <span>{t('metrics.users')}</span>
          </div>
        </div>

        {/* Supporters and timestamp */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <div className="flex items-center gap-1.5">
            <Heart className="h-3.5 w-3.5 text-rose-500" />
            <AnimatedCounter 
              value={metrics.totalDonations} 
              className="font-medium text-foreground" 
            />
            <span>
              {metrics.totalDonations === 1 ? t('supporter') : t('supporters')}
            </span>
          </div>
          <div className="flex items-center gap-1 opacity-70">
            <Clock className="h-3 w-3" />
            <span>{timeSinceUpdate}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
