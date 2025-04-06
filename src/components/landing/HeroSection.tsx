
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroSectionProps {
  isLoggedIn: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ isLoggedIn }) => {
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
    <section className="relative py-20 md:py-32 overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
            {i18n.language === 'pt-BR' ? 'Converta ZPL para PDF de Forma Rápida e Segura' : 'Convert ZPL to PDF Quickly and Securely'}
          </h1>
          <p className="text-xl mb-10 text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            {i18n.language === 'pt-BR' 
              ? 'Simplifique o seu fluxo de impressão de etiquetas e ganhe tempo com a nossa solução online confiável'
              : 'Simplify your label printing workflow and save time with our reliable online solution'}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Button 
              size="lg" 
              onClick={handleGetStarted} 
              className="px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:bg-primary-foreground/10 active:scale-[0.98] cursor-pointer w-full sm:w-auto"
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
                className="px-8 py-6 text-lg rounded-full shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer w-full sm:w-auto"
                aria-label="Log In"
              >
                <LogIn className="mr-2 h-5 w-5" />
                {i18n.language === 'pt-BR' ? 'Entrar na Conta' : 'Log In'}
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Background decoration */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
    </section>
  );
};
