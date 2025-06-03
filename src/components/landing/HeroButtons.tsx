
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroButtonsProps {
  isLoggedIn: boolean;
}

export const HeroButtons: React.FC<HeroButtonsProps> = ({ isLoggedIn }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (isLoggedIn) {
      navigate('/app');
    } else {
      navigate('/auth');
    }
  };

  const handleLogin = () => {
    navigate('/auth');
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
      <Button 
        size="lg" 
        onClick={handleGetStarted} 
        className="px-8 py-6 text-lg rounded-full w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
        aria-label={isLoggedIn ? 'Access Application' : 'Create Free Account'}
      >
        {isLoggedIn 
          ? (i18n.language === 'pt-BR' ? 'Acessar Aplicativo' : 'Access Application') 
          : (i18n.language === 'pt-BR' ? 'Crie sua Conta Gratuitamente' : 'Create Your Free Account')}
        <ArrowRight className="ml-2 h-5 w-5" />
      </Button>
      {!isLoggedIn && (
        <Button 
          size="lg" 
          variant="outline" 
          onClick={handleLogin} 
          className="px-8 py-6 text-lg rounded-full w-full sm:w-auto border-emerald-600 text-emerald-600 hover:bg-emerald-50"
          aria-label="Log In"
        >
          <LogIn className="mr-2 h-5 w-5" />
          {i18n.language === 'pt-BR' ? 'Entrar na Conta' : 'Log In'}
        </Button>
      )}
    </div>
  );
};
