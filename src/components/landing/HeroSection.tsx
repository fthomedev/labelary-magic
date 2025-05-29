
import React from 'react';
import { useTranslation } from 'react-i18next';
import { HeroButtons } from './HeroButtons';

interface HeroSectionProps {
  isLoggedIn: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ isLoggedIn }) => {
  const { t } = useTranslation();

  return (
    <section className="relative py-16 overflow-hidden" id="hero-section">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
            {t('heroTitle')}
          </h1>
          <p className="text-xl mb-8 text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            {t('heroSubtitle')}
          </p>
          <HeroButtons isLoggedIn={isLoggedIn} />
        </div>
      </div>
      
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-2xl opacity-70" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-2xl opacity-70" />
    </section>
  );
};
