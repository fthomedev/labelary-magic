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

  const getMetricContent = () => {
    switch (currentMetric) {
      case 'labelsToday':
        return {
          icon: <Tag className="h-3.5 w-3.5" />,
          text: t('metrics.labelsToday', { count: labelsToday }),
          value: labelsToday,
        };
      case 'conversionsToday':
        return {
          icon: <TrendingUp className="h-3.5 w-3.5" />,
          text: t('metrics.conversionsToday', { count: conversionsToday }),
          value: conversionsToday,
        };
      case 'totalLabels':
        return {
          icon: <Tag className="h-3.5 w-3.5" />,
          text: t('metrics.totalLabelsProcessed', { count: totalLabels }),
          value: totalLabels,
        };
      case 'users':
        return {
          icon: <Users className="h-3.5 w-3.5" />,
          text: t('metrics.uniqueUsers', { count: uniqueUsers }),
          value: uniqueUsers,
        };
      case 'supporters':
        return {
          icon: <Heart className="h-3.5 w-3.5 text-rose-500" />,
          text: totalDonations === 1 
            ? t('metrics.supporterKeepingAlive', { count: totalDonations })
            : t('metrics.supportersKeepingAlive', { count: totalDonations }),
          value: totalDonations,
        };
      default:
        return { icon: null, text: '', value: 0 };
    }
  };

  const { icon, text, value } = getMetricContent();

  if (compact) {
    return (
      <div 
        className={`inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-opacity duration-300 ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {icon}
        <span>
          <AnimatedCounter value={value} duration={800} /> {text.replace(/[\d.,]+/, '').trim()}
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
      <span>{text.split('{{count}}')[0]}</span>
      <AnimatedCounter value={value} duration={800} className="font-medium text-foreground" />
      <span>{text.split('{{count}}')[1] || ''}</span>
    </div>
  );
};
