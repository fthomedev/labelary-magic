import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { AnimatedCounter } from './AnimatedCounter';
import { Tag, Users, Heart, TrendingUp } from 'lucide-react';

interface RotatingMetricBadgeProps {
  totalLabels: number;
  labelsToday: number;
  conversionsToday: number;
  totalDonations: number;
  uniqueUsers: number;
  rotationInterval?: number;
  compact?: boolean;
}

type MetricType = 'labelsToday' | 'conversionsToday' | 'totalLabels' | 'supporters' | 'users';

export const RotatingMetricBadge: React.FC<RotatingMetricBadgeProps> = ({
  totalLabels,
  labelsToday,
  conversionsToday,
  totalDonations,
  uniqueUsers,
  rotationInterval = 8000,
  compact = false,
}) => {
  const { t } = useTranslation();
  const [currentMetric, setCurrentMetric] = useState<MetricType>('labelsToday');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const metrics: MetricType[] = ['labelsToday', 'conversionsToday', 'totalLabels', 'users', 'supporters'];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentMetric(prev => {
          const currentIndex = metrics.indexOf(prev);
          return metrics[(currentIndex + 1) % metrics.length];
        });
        setIsTransitioning(false);
      }, 300);
    }, rotationInterval);

    return () => clearInterval(interval);
  }, [rotationInterval]);

  const getMetricContent = (): { icon: React.ReactNode; prefix: string; value: number; suffix: string } => {
    const parseTranslation = (key: string, count: number): { prefix: string; suffix: string } => {
      const translated = t(key, { count });
      const countStr = count.toLocaleString('pt-BR');
      const parts = translated.split(countStr);
      if (parts.length >= 2) {
        return { prefix: parts[0].trim(), suffix: parts.slice(1).join(countStr).trim() };
      }
      // Fallback: remove any number pattern
      const cleaned = translated.replace(/[\d.,]+/g, '').trim();
      return { prefix: '', suffix: cleaned };
    };

    switch (currentMetric) {
      case 'labelsToday': {
        const { prefix, suffix } = parseTranslation('metrics.labelsToday', labelsToday);
        return { icon: <Tag className="h-3.5 w-3.5" />, prefix, value: labelsToday, suffix };
      }
      case 'conversionsToday': {
        const { prefix, suffix } = parseTranslation('metrics.conversionsToday', conversionsToday);
        return { icon: <TrendingUp className="h-3.5 w-3.5" />, prefix, value: conversionsToday, suffix };
      }
      case 'totalLabels': {
        const { prefix, suffix } = parseTranslation('metrics.totalLabelsProcessed', totalLabels);
        return { icon: <Tag className="h-3.5 w-3.5" />, prefix, value: totalLabels, suffix };
      }
      case 'users': {
        const { prefix, suffix } = parseTranslation('metrics.uniqueUsers', uniqueUsers);
        return { icon: <Users className="h-3.5 w-3.5" />, prefix, value: uniqueUsers, suffix };
      }
      case 'supporters': {
        const key = totalDonations === 1 ? 'metrics.supporterKeepingAlive' : 'metrics.supportersKeepingAlive';
        const { prefix, suffix } = parseTranslation(key, totalDonations);
        return { icon: <Heart className="h-3.5 w-3.5 text-rose-500" />, prefix, value: totalDonations, suffix };
      }
      default:
        return { icon: null, prefix: '', value: 0, suffix: '' };
    }
  };

  const { icon, prefix, value, suffix } = getMetricContent();

  if (compact) {
    return (
      <div 
        className={`inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-opacity duration-300 ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {icon}
        <span>
          {prefix && <span>{prefix} </span>}
          <AnimatedCounter value={value} duration={800} />
          {suffix && <span> {suffix}</span>}
        </span>
      </div>
    );
  }

  return (
    <div 
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted/50 text-xs text-muted-foreground transition-all duration-300 ${
        isTransitioning ? 'opacity-0 transform -translate-y-1' : 'opacity-100 transform translate-y-0'
      }`}
    >
      {icon}
      {prefix && <span>{prefix}</span>}
      <AnimatedCounter value={value} duration={800} className="font-medium text-foreground" />
      {suffix && <span>{suffix}</span>}
    </div>
  );
};
