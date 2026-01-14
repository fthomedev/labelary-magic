import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Zap, Shield, Layers, Cloud, HeartHandshake } from 'lucide-react';

interface BenefitCardProps {
  icon: React.ReactNode;
  titlePt: string;
  titleEn: string;
  descPt: string;
  descEn: string;
  isPortuguese: boolean;
  highlight?: boolean;
}

const BenefitCard: React.FC<BenefitCardProps> = ({ 
  icon, titlePt, titleEn, descPt, descEn, isPortuguese, highlight 
}) => (
  <div className={`p-6 rounded-2xl transition-all duration-300 hover:-translate-y-1 ${
    highlight 
      ? 'bg-gradient-to-br from-primary/10 to-primary/5 border-2 border-primary/20 shadow-lg' 
      : 'bg-card border border-border hover:shadow-md'
  }`}>
    <div className={`inline-flex p-3 rounded-xl mb-4 ${
      highlight ? 'bg-primary text-primary-foreground' : 'bg-muted text-primary'
    }`}>
      {icon}
    </div>
    <h3 className="text-xl font-bold text-foreground mb-2">
      {isPortuguese ? titlePt : titleEn}
    </h3>
    <p className="text-muted-foreground">
      {isPortuguese ? descPt : descEn}
    </p>
  </div>
);

export const BenefitsSection: React.FC = () => {
  const { i18n } = useTranslation();
  const isPortuguese = i18n.language === 'pt-BR';
  
  const benefits = [
    {
      icon: <Sparkles className="h-6 w-6" />,
      titlePt: 'Qualidade HD com IA',
      titleEn: 'HD Quality with AI',
      descPt: 'Inteligência artificial para upscaling inteligente. Etiquetas mais nítidas e legíveis.',
      descEn: 'Artificial intelligence for smart upscaling. Sharper and more readable labels.',
      highlight: true
    },
    {
      icon: <Zap className="h-6 w-6" />,
      titlePt: 'Conversão Instantânea',
      titleEn: 'Instant Conversion',
      descPt: 'Processamento em nuvem, sem necessidade de instalar softwares. Resultados em segundos.',
      descEn: 'Cloud processing, no software installation needed. Results in seconds.',
      highlight: false
    },
    {
      icon: <Layers className="h-6 w-6" />,
      titlePt: 'Múltiplos Formatos',
      titleEn: 'Multiple Formats',
      descPt: 'Suporte a ZPL, TXT e arquivos ZIP. Processe centenas de etiquetas de uma vez.',
      descEn: 'Support for ZPL, TXT and ZIP files. Process hundreds of labels at once.',
      highlight: false
    },
    {
      icon: <Shield className="h-6 w-6" />,
      titlePt: 'Segurança Garantida',
      titleEn: 'Guaranteed Security',
      descPt: 'Seus dados protegidos com conexões seguras. Histórico com exclusão automática.',
      descEn: 'Your data protected with secure connections. History with automatic deletion.',
      highlight: false
    },
    {
      icon: <Cloud className="h-6 w-6" />,
      titlePt: 'Sem Instalação',
      titleEn: 'No Installation',
      descPt: 'Acesse de qualquer dispositivo, a qualquer hora. 100% online e sempre atualizado.',
      descEn: 'Access from any device, anytime. 100% online and always updated.',
      highlight: false
    },
    {
      icon: <HeartHandshake className="h-6 w-6" />,
      titlePt: '100% Gratuito',
      titleEn: '100% Free',
      descPt: 'Ferramenta completa sem custos. Mantida por doações da comunidade.',
      descEn: 'Complete tool at no cost. Maintained by community donations.',
      highlight: false
    }
  ];
  
  return (
    <section className="py-20 bg-muted/30" id="beneficios">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {isPortuguese ? 'Por que Escolher o ZPL Easy?' : 'Why Choose ZPL Easy?'}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {isPortuguese 
              ? 'A ferramenta mais completa para converter etiquetas ZPL em PDF com qualidade profissional'
              : 'The most complete tool to convert ZPL labels to PDF with professional quality'}
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => (
            <BenefitCard
              key={index}
              {...benefit}
              isPortuguese={isPortuguese}
            />
          ))}
        </div>
      </div>
    </section>
  );
};
