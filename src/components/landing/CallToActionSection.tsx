
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

interface CallToActionSectionProps {
  isLoggedIn: boolean;
}

export const CallToActionSection: React.FC<CallToActionSectionProps> = ({ isLoggedIn }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (isLoggedIn) {
      navigate('/app');
    } else {
      navigate('/auth');
    }
  };

  return (
    <section className="py-20 bg-gradient-to-br from-primary/20 to-primary/5" id="cadastro">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            {isLoggedIn ? t('ctaTitleLoggedIn') : t('ctaTitle')}
          </h2>
          <p className="text-xl mb-10 text-gray-600 dark:text-gray-300">
            {isLoggedIn ? t('ctaSubtitleLoggedIn') : t('ctaSubtitle')}
          </p>
          <Button 
            size="lg" 
            onClick={handleGetStarted}
            className="px-8 py-6 text-lg"
          >
            {isLoggedIn ? t('ctaButtonLoggedIn') : t('ctaButton')}
          </Button>
        </div>
      </div>
    </section>
  );
};
