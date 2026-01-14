import React from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Files, Package, Clock, Heart, Zap } from 'lucide-react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  isHighlighted?: boolean;
}

const FeatureCard: React.FC<FeatureCardProps> = ({ icon, title, description, isHighlighted }) => (
  <div className={`
    relative p-6 rounded-2xl transition-all duration-300 hover:scale-105 hover:shadow-xl
    ${isHighlighted 
      ? 'bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/30' 
      : 'bg-card border border-border/50 hover:border-primary/30'
    }
  `}>
    {isHighlighted && (
      <span className="absolute -top-3 left-6 px-3 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-full">
        NOVO
      </span>
    )}
    <div className={`
      w-14 h-14 rounded-xl flex items-center justify-center mb-4
      ${isHighlighted ? 'bg-primary text-primary-foreground' : 'bg-primary/10 text-primary'}
    `}>
      {icon}
    </div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
  </div>
);

export const FeaturesSection: React.FC = () => {
  const { i18n } = useTranslation();
  const isPt = i18n.language === 'pt-BR';

  const features = [
    {
      icon: <Sparkles className="w-7 h-7" />,
      title: isPt ? 'Nitidez+ com IA' : 'Sharpness+ with AI',
      description: isPt 
        ? 'Etiquetas com qualidade superior através de inteligência artificial. Ideal para códigos de barras.' 
        : 'Superior quality labels through artificial intelligence. Ideal for barcodes.',
      isHighlighted: true
    },
    {
      icon: <Files className="w-7 h-7" />,
      title: isPt ? 'Multi-formato' : 'Multi-format',
      description: isPt 
        ? 'Aceita TXT, ZPL, ZIP e até PDF. Processe vários arquivos de uma só vez.' 
        : 'Accepts TXT, ZPL, ZIP and even PDF. Process multiple files at once.',
      isHighlighted: false
    },
    {
      icon: <Package className="w-7 h-7" />,
      title: isPt ? 'Lote de Etiquetas' : 'Batch Labels',
      description: isPt 
        ? 'Converta centenas de etiquetas simultaneamente. Perfeito para grandes volumes.' 
        : 'Convert hundreds of labels simultaneously. Perfect for large volumes.',
      isHighlighted: false
    },
    {
      icon: <Clock className="w-7 h-7" />,
      title: isPt ? 'Histórico 60 dias' : '60-day History',
      description: isPt 
        ? 'Acesse suas conversões anteriores por até 60 dias. Baixe novamente quando precisar.' 
        : 'Access your previous conversions for up to 60 days. Download again when needed.',
      isHighlighted: false
    },
    {
      icon: <Zap className="w-7 h-7" />,
      title: isPt ? 'Conversão Rápida' : 'Fast Conversion',
      description: isPt 
        ? 'Processamento em nuvem ultra-rápido. Suas etiquetas prontas em segundos.' 
        : 'Ultra-fast cloud processing. Your labels ready in seconds.',
      isHighlighted: false
    },
    {
      icon: <Heart className="w-7 h-7" />,
      title: isPt ? '100% Gratuito' : '100% Free',
      description: isPt 
        ? 'Sem custos, sem limites abusivos. Mantido por doações da comunidade.' 
        : 'No costs, no abusive limits. Maintained by community donations.',
      isHighlighted: false
    }
  ];

  return (
    <section className="py-20 bg-muted/30" id="recursos">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            {isPt ? 'Recursos' : 'Features'}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {isPt ? 'Tudo que você precisa para suas etiquetas' : 'Everything you need for your labels'}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {isPt 
              ? 'Uma ferramenta completa para converter, visualizar e gerenciar suas etiquetas ZPL de forma simples e eficiente.' 
              : 'A complete tool to convert, view and manage your ZPL labels simply and efficiently.'}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
