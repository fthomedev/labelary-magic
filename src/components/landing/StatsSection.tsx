import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FileCheck, Users, Sparkles } from 'lucide-react';

interface CounterProps {
  end: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
}

const AnimatedCounter: React.FC<CounterProps> = ({ end, duration = 2000, suffix = '', prefix = '' }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    const startValue = 0;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(startValue + (end - startValue) * easeOutQuart);
      
      setCount(currentCount);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isVisible, end, duration]);

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}{count.toLocaleString()}{suffix}
    </span>
  );
};

interface StatCardProps {
  icon: React.ReactNode;
  value: number;
  suffix?: string;
  prefix?: string;
  labelPt: string;
  labelEn: string;
  isPortuguese: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ icon, value, suffix, prefix, labelPt, labelEn, isPortuguese }) => (
  <div className="flex flex-col items-center p-6 bg-card rounded-2xl border border-border shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1">
    <div className="p-3 bg-primary/10 rounded-full mb-4 text-primary">
      {icon}
    </div>
    <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">
      <AnimatedCounter end={value} suffix={suffix} prefix={prefix} />
    </div>
    <p className="text-muted-foreground text-center font-medium">
      {isPortuguese ? labelPt : labelEn}
    </p>
  </div>
);

export const StatsSection: React.FC = () => {
  const { i18n } = useTranslation();
  const isPortuguese = i18n.language === 'pt-BR';

  const stats = [
    {
      icon: <FileCheck className="h-8 w-8" />,
      value: 50000,
      suffix: '+',
      labelPt: 'Etiquetas Convertidas',
      labelEn: 'Labels Converted'
    },
    {
      icon: <Users className="h-8 w-8" />,
      value: 2500,
      suffix: '+',
      labelPt: 'Usuários Ativos',
      labelEn: 'Active Users'
    },
    {
      icon: <Sparkles className="h-8 w-8" />,
      value: 100,
      suffix: '%',
      labelPt: 'Gratuito',
      labelEn: 'Free'
    }
  ];

  return (
    <section className="py-16 bg-muted/30" id="stats">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {stats.map((stat, index) => (
            <StatCard
              key={index}
              icon={stat.icon}
              value={stat.value}
              suffix={stat.suffix}
              labelPt={stat.labelPt}
              labelEn={stat.labelEn}
              isPortuguese={isPortuguese}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
