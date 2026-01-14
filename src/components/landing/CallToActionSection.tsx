import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check, Sparkles } from 'lucide-react';

interface CallToActionSectionProps {
  isLoggedIn: boolean;
}

export const CallToActionSection: React.FC<CallToActionSectionProps> = ({ isLoggedIn }) => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isPt = i18n.language === 'pt-BR';

  const handleGetStarted = () => {
    if (isLoggedIn) {
      navigate('/app');
    } else {
      navigate('/auth');
    }
  };

  const benefits = isPt 
    ? [
        'Conversão ilimitada de etiquetas',
        'Modo Nitidez+ com IA incluso',
        'Histórico de 60 dias',
        'Suporte a múltiplos formatos',
        '100% gratuito'
      ]
    : [
        'Unlimited label conversion',
        'Sharpness+ AI mode included',
        '60-day history',
        'Multi-format support',
        '100% free'
      ];

  return (
    <section className="py-24 relative overflow-hidden" id="cadastro">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card/80 backdrop-blur-sm border border-border/50 rounded-3xl p-10 md:p-14 shadow-2xl">
            <div className="text-center">
              {/* Badge */}
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-6">
                <Sparkles className="w-4 h-4" />
                {isPt ? 'Comece agora mesmo' : 'Start right now'}
              </span>
              
              {/* Title */}
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
                {isLoggedIn 
                  ? (isPt ? 'Acesse Seu Painel' : 'Access Your Dashboard')
                  : (isPt ? 'Comece Gratuitamente' : 'Start for Free')}
              </h2>
              
              {/* Subtitle */}
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                {isLoggedIn
                  ? (isPt 
                      ? 'Continue convertendo suas etiquetas ZPL para PDF com facilidade.' 
                      : 'Continue converting your ZPL labels to PDF with ease.')
                  : (isPt 
                      ? 'Crie sua conta grátis e converta suas primeiras etiquetas em menos de 1 minuto.' 
                      : 'Create your free account and convert your first labels in less than 1 minute.')}
              </p>
              
              {/* Benefits list */}
              {!isLoggedIn && (
                <div className="grid sm:grid-cols-2 gap-3 max-w-xl mx-auto mb-10">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2 text-left">
                      <div className="w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="text-sm">{benefit}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {/* CTA Button */}
              <Button 
                size="lg" 
                onClick={handleGetStarted}
                className="px-10 py-7 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all group"
              >
                {isLoggedIn
                  ? (isPt ? 'Ir para o Dashboard' : 'Go to Dashboard')
                  : (isPt ? 'Criar Conta Grátis' : 'Create Free Account')}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              {!isLoggedIn && (
                <p className="mt-4 text-sm text-muted-foreground">
                  {isPt ? 'Sem cartão de crédito. Sem compromisso.' : 'No credit card. No commitment.'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToActionSection;
