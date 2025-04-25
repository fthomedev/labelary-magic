
import React, { memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroButtonsProps {
  isLoggedIn: boolean;
}

export const HeroButtons: React.FC<HeroButtonsProps> = memo(({ isLoggedIn }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isPortuguese = i18n.language === 'pt-BR';

  const handleGetStarted = useCallback(() => {
    navigate(isLoggedIn ? '/app' : '/auth');
  }, [navigate, isLoggedIn]);

  const handleLogin = useCallback(() => {
    navigate('/auth');
  }, [navigate]);

  const mainButtonText = isLoggedIn 
    ? (isPortuguese ? 'Acessar Aplicativo' : 'Access Application')
    : (isPortuguese ? 'Crie sua Conta Gratuitamente' : 'Create Your Free Account');
  
  const loginButtonText = isPortuguese ? 'Entrar na Conta' : 'Log In';
  const loginAriaLabel = 'Log In';
  const mainAriaLabel = isLoggedIn ? 'Access Application' : 'Create Free Account';

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
      <Button 
        size="lg" 
        onClick={handleGetStarted} 
        className="px-8 py-6 text-lg rounded-full w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
        aria-label={mainAriaLabel}
      >
        {mainButtonText}
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
      {!isLoggedIn && (
        <Button 
          size="lg" 
          variant="outline" 
          onClick={handleLogin} 
          className="px-8 py-6 text-lg rounded-full w-full sm:w-auto border-emerald-600 text-emerald-600 hover:bg-emerald-50"
          aria-label={loginAriaLabel}
        >
          <LogIn className="mr-2 h-5 w-5" />
          {loginButtonText}
        </Button>
      )}
    </div>
  );
});

HeroButtons.displayName = 'HeroButtons';

export default HeroButtons;
