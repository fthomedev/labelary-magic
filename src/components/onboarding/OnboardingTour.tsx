import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { OnboardingTooltip, OnboardingStep } from './OnboardingTooltip';

interface OnboardingTourProps {
  forceShow?: boolean;
  onComplete?: () => void;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ forceShow = false, onComplete }) => {
  const { t } = useTranslation();
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasChecked, setHasChecked] = useState(false);

  const steps: OnboardingStep[] = [
    {
      targetSelector: '[data-onboarding="upload"]',
      title: t('onboarding.step1Title'),
      description: t('onboarding.step1Desc'),
      position: 'bottom',
    },
    {
      targetSelector: '[data-onboarding="format"]',
      title: t('onboarding.step2Title'),
      description: t('onboarding.step2Desc'),
      position: 'bottom',
    },
    {
      targetSelector: '[data-onboarding="history"]',
      title: t('onboarding.step3Title'),
      description: t('onboarding.step3Desc'),
      position: 'left',
    },
  ];

  useEffect(() => {
    if (forceShow) {
      setCurrentStep(0);
      setIsActive(true);
      setHasChecked(true);
      return;
    }

    const checkOnboarding = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single();

        if (profile && !profile.onboarding_completed) {
          setCurrentStep(0);
          setIsActive(true);
        }
      } catch (err) {
        console.error('Error checking onboarding status:', err);
      } finally {
        setHasChecked(true);
      }
    };

    checkOnboarding();
  }, [forceShow]);

  const markComplete = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ onboarding_completed: true })
          .eq('id', user.id);
      }
    } catch (err) {
      console.error('Error marking onboarding complete:', err);
    }
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      // Last step -> finish
      setIsActive(false);
      markComplete();
      onComplete?.();
    }
  }, [currentStep, steps.length, markComplete, onComplete]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    setIsActive(false);
    markComplete();
    onComplete?.();
  }, [markComplete, onComplete]);

  if (!isActive || !hasChecked) return null;

  return (
    <OnboardingTooltip
      step={steps[currentStep]}
      currentStep={currentStep}
      totalSteps={steps.length}
      onNext={handleNext}
      onBack={handleBack}
      onSkip={handleSkip}
    />
  );
};
