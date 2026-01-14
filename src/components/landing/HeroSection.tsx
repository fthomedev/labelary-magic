import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Sparkles, FileText, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface HeroSectionProps {
  isLoggedIn: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ isLoggedIn }) => {
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

  const features = [
    { pt: '100% Gratuito', en: '100% Free' },
    { pt: 'Sem instalação', en: 'No installation' },
    { pt: 'Upscaling com IA', en: 'AI Upscaling' },
  ];

  return (
    <section className="relative py-20 md:py-28 overflow-hidden" id="hero-section">
      {/* Background decorations */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />
      </div>

      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* AI Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/20 rounded-full text-primary text-sm font-medium mb-6 animate-fade-in">
            <Sparkles className="h-4 w-4" />
            {isPortuguese ? 'Agora com Inteligência Artificial' : 'Now with Artificial Intelligence'}
          </div>

          {/* Main headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground leading-tight">
            {isPortuguese ? (
              <>
                Transforme <span className="text-primary">ZPL em PDF</span>
                <br />
                com Qualidade HD
              </>
            ) : (
              <>
                Transform <span className="text-primary">ZPL to PDF</span>
                <br />
                with HD Quality
              </>
            )}
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {isPortuguese 
              ? 'A ferramenta gratuita mais completa para converter etiquetas ZPL. Processamento com IA para qualidade superior de impressão.'
              : 'The most complete free tool to convert ZPL labels. AI processing for superior print quality.'}
          </p>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-full text-sm"
              >
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span className="text-foreground">{isPortuguese ? feature.pt : feature.en}</span>
              </div>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button 
              size="lg" 
              onClick={handleGetStarted} 
              className="px-8 py-6 text-lg rounded-full w-full sm:w-auto gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
            >
              {isLoggedIn 
                ? (isPortuguese ? 'Acessar Aplicativo' : 'Access Application') 
                : (isPortuguese ? 'Começar Grátis' : 'Start Free')}
              <ArrowRight className="h-5 w-5" />
            </Button>
            <a 
              href="#como-funciona"
              className="text-muted-foreground hover:text-foreground transition-colors font-medium"
            >
              {isPortuguese ? 'Como funciona?' : 'How it works?'}
            </a>
          </div>

          {/* Visual Demo */}
          <div className="relative max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-4 p-6 bg-card border border-border rounded-2xl shadow-lg">
              {/* ZPL Input */}
              <div className="flex-1 p-4 bg-muted rounded-xl text-left">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">arquivo.zpl</span>
                </div>
                <code className="text-xs text-muted-foreground block font-mono">
                  ^XA^FO50,50^A0N,30<br />
                  ^FDEtiqueta^FS^XZ
                </code>
              </div>

              {/* Arrow */}
              <div className="flex flex-col items-center gap-1">
                <ArrowRight className="h-6 w-6 text-primary" />
                <span className="text-xs text-primary font-medium">
                  {isPortuguese ? 'IA' : 'AI'}
                </span>
              </div>

              {/* PDF Output */}
              <div className="flex-1 p-4 bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px] rounded font-bold">HD</span>
                  </div>
                  <span className="text-xs font-medium text-primary">etiquetas.pdf</span>
                </div>
                <div className="h-12 bg-card/50 rounded-lg border border-primary/20 flex items-center justify-center">
                  <span className="text-xs text-primary font-medium">
                    {isPortuguese ? 'Alta Qualidade' : 'High Quality'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
