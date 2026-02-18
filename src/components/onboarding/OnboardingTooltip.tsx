import React, { useEffect, useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { X, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface OnboardingStep {
  targetSelector: string;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

interface OnboardingTooltipProps {
  step: OnboardingStep;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}

export const OnboardingTooltip: React.FC<OnboardingTooltipProps> = ({
  step,
  currentStep,
  totalSteps,
  onNext,
  onBack,
  onSkip,
}) => {
  const { t } = useTranslation();
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  useEffect(() => {
    const updatePosition = () => {
      const el = document.querySelector(step.targetSelector);
      if (el) {
        const rect = el.getBoundingClientRect();
        setCoords({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        });
        // Scroll element into view
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    };

    // Small delay to let DOM settle
    const timeout = setTimeout(updatePosition, 300);
    window.addEventListener('resize', updatePosition);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', updatePosition);
    };
  }, [step.targetSelector]);

  if (!coords) return null;

  const padding = 8;
  const tooltipOffset = 12;

  // Calculate tooltip position (default: bottom)
  const pos = step.position || 'bottom';
  let tooltipStyle: React.CSSProperties = {};

  if (pos === 'bottom') {
    tooltipStyle = {
      top: coords.top + coords.height + tooltipOffset,
      left: Math.max(16, coords.left + coords.width / 2 - 160),
    };
  } else if (pos === 'top') {
    tooltipStyle = {
      top: coords.top - tooltipOffset - 180,
      left: Math.max(16, coords.left + coords.width / 2 - 160),
    };
  } else if (pos === 'right') {
    tooltipStyle = {
      top: coords.top + coords.height / 2 - 60,
      left: coords.left + coords.width + tooltipOffset,
    };
  } else if (pos === 'left') {
    tooltipStyle = {
      top: coords.top + coords.height / 2 - 60,
      left: coords.left - tooltipOffset - 320,
    };
  }

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-[9998] bg-black/60 transition-opacity duration-300" onClick={onSkip} />
      
      {/* Highlight cutout */}
      <div
        className="fixed z-[9999] rounded-lg ring-4 ring-primary/60 shadow-2xl pointer-events-none transition-all duration-300"
        style={{
          top: coords.top - padding,
          left: coords.left - padding,
          width: coords.width + padding * 2,
          height: coords.height + padding * 2,
        }}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="absolute z-[10000] w-80 max-w-[calc(100vw-32px)] bg-card border border-border rounded-xl shadow-2xl p-4 animate-in fade-in-0 zoom-in-95 duration-200"
        style={tooltipStyle}
      >
        {/* Step counter + skip */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground font-medium">
            {currentStep + 1} / {totalSteps}
          </span>
          <button
            onClick={onSkip}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <X className="h-3 w-3" />
            {t('onboarding.skip')}
          </button>
        </div>

        {/* Content */}
        <h3 className="text-sm font-semibold text-foreground mb-1">{step.title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed mb-4">{step.description}</p>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-2">
          {!isFirst ? (
            <Button variant="ghost" size="sm" onClick={onBack} className="text-xs gap-1">
              <ArrowLeft className="h-3 w-3" />
              {t('back')}
            </Button>
          ) : (
            <div />
          )}
          <Button size="sm" onClick={onNext} className="text-xs gap-1">
            {isLast ? (
              <>
                <Check className="h-3 w-3" />
                {t('onboarding.finish')}
              </>
            ) : (
              <>
                {t('onboarding.next')}
                <ArrowRight className="h-3 w-3" />
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
};
