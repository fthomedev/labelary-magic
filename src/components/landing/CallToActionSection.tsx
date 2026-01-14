import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CallToActionSectionProps {
  isLoggedIn: boolean;
}

export const CallToActionSection: React.FC<CallToActionSectionProps> = ({ isLoggedIn }) => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isPortuguese = i18n.language === 'pt-BR';

  const handleGetStarted = () => {
    if (isLoggedIn) {
      navigate('/app');
    } else {
      navigate('/auth');
    }
  };

  const benefits = [
    { pt: 'Sem cartão de crédito', en: 'No credit card required' },
    { pt: 'Acesso imediato', en: 'Immediate access' },
    { pt: 'Suporte gratuito', en: 'Free support' },
  ];

  return (
    <section className="py-24 relative overflow-hidden" id="cadastro">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            {isPortuguese ? '100% Gratuito' : '100% Free'}
          </div>

          {/* Headline */}
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            {isLoggedIn 
              ? (isPortuguese ? 'Pronto para Converter?' : 'Ready to Convert?')
              : (isPortuguese ? 'Comece Agora Gratuitamente' : 'Start Now for Free')}
          </h2>
          
          {/* Description */}
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {isLoggedIn
              ? (isPortuguese 
                  ? 'Continue convertendo suas etiquetas ZPL com qualidade HD.' 
                  : 'Continue converting your ZPL labels with HD quality.')
              : (isPortuguese 
                  ? 'Junte-se a milhares de usuários que já converteram suas etiquetas ZPL com qualidade profissional.' 
                  : 'Join thousands of users who have already converted their ZPL labels with professional quality.')}
          </p>

          {/* Benefits */}
          {!isLoggedIn && (
            <div className="flex flex-wrap justify-center gap-4 mb-10">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span>{isPortuguese ? benefit.pt : benefit.en}</span>
                </div>
              ))}
            </div>
          )}

          {/* CTA Button */}
          <Button 
            size="lg" 
            onClick={handleGetStarted}
            className="px-10 py-7 text-lg rounded-full gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
          >
            {isLoggedIn
              ? (isPortuguese ? 'Ir para o Dashboard' : 'Go to Dashboard')
              : (isPortuguese ? 'Criar Conta Grátis' : 'Create Free Account')}
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </section>
  );
};
