
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

interface CallToActionSectionProps {
  isLoggedIn: boolean;
}

export const CallToActionSection: React.FC<CallToActionSectionProps> = ({ isLoggedIn }) => {
  const { t, i18n } = useTranslation();
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
            {isLoggedIn 
              ? (i18n.language === 'pt-BR' ? 'Acesse Seu Painel de Controle' : 'Access Your Dashboard')
              : (i18n.language === 'pt-BR' ? 'Crie Sua Conta Agora Mesmo' : 'Create Your Account Right Now')}
          </h2>
          <p className="text-xl mb-10 text-gray-600 dark:text-gray-300">
            {isLoggedIn
              ? (i18n.language === 'pt-BR' 
                  ? 'Continue convertendo ZPL para PDF com facilidade no seu painel de controle.' 
                  : 'Continue converting ZPL to PDF easily in your dashboard.')
              : (i18n.language === 'pt-BR' 
                  ? 'Faça parte de uma comunidade que já converteu milhares de etiquetas ZPL com apenas alguns cliques.' 
                  : 'Join a community that has already converted thousands of ZPL labels with just a few clicks.')}
          </p>
          <Button 
            size="lg" 
            onClick={handleGetStarted}
            className="px-8 py-6 text-lg"
          >
            {isLoggedIn
              ? (i18n.language === 'pt-BR' ? 'Ir para o Dashboard' : 'Go to Dashboard')
              : (i18n.language === 'pt-BR' ? 'Cadastrar / Login' : 'Register / Login')}
          </Button>
        </div>
      </div>
    </section>
  );
};
