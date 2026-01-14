import React from 'react';
import { useTranslation } from 'react-i18next';
import { Zap, Sparkles, Clock, Image, Check } from 'lucide-react';

interface ComparisonCardProps {
  type: 'standard' | 'hd';
  isPortuguese: boolean;
}

const ComparisonCard: React.FC<ComparisonCardProps> = ({ type, isPortuguese }) => {
  const isHD = type === 'hd';
  
  const features = isHD ? [
    { pt: 'Processamento com IA', en: 'AI Processing' },
    { pt: 'Qualidade superior de impressão', en: 'Superior print quality' },
    { pt: 'Ideal para códigos de barras complexos', en: 'Ideal for complex barcodes' },
    { pt: 'Melhor nitidez em textos pequenos', en: 'Better sharpness for small text' }
  ] : [
    { pt: 'Conversão instantânea', en: 'Instant conversion' },
    { pt: 'Processamento rápido', en: 'Fast processing' },
    { pt: 'Ideal para grandes volumes', en: 'Ideal for large volumes' },
    { pt: 'Qualidade padrão confiável', en: 'Reliable standard quality' }
  ];

  return (
    <div className={`relative p-6 md:p-8 rounded-2xl border-2 transition-all duration-300 hover:shadow-lg ${
      isHD 
        ? 'border-primary bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5' 
        : 'border-border bg-card'
    }`}>
      {isHD && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="px-4 py-1 bg-primary text-primary-foreground text-sm font-semibold rounded-full flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            {isPortuguese ? 'Recomendado' : 'Recommended'}
          </span>
        </div>
      )}
      
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-3 rounded-xl ${isHD ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
          {isHD ? <Image className="h-6 w-6" /> : <Zap className="h-6 w-6" />}
        </div>
        <div>
          <h3 className="text-xl font-bold text-foreground">
            {isHD ? 'HD' : 'Standard'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isHD 
              ? (isPortuguese ? 'Alta Qualidade com IA' : 'High Quality with AI')
              : (isPortuguese ? 'Conversão Rápida' : 'Fast Conversion')
            }
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2 mb-6 text-muted-foreground">
        <Clock className="h-4 w-4" />
        <span className="text-sm">
          {isHD 
            ? (isPortuguese ? '~2-3 seg/etiqueta' : '~2-3 sec/label')
            : (isPortuguese ? '< 1 seg/etiqueta' : '< 1 sec/label')
          }
        </span>
      </div>

      <ul className="space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-3">
            <Check className={`h-5 w-5 mt-0.5 flex-shrink-0 ${isHD ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className="text-foreground">
              {isPortuguese ? feature.pt : feature.en}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export const ComparisonSection: React.FC = () => {
  const { i18n } = useTranslation();
  const isPortuguese = i18n.language === 'pt-BR';

  return (
    <section className="py-20 bg-background" id="comparativo">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <span className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            {isPortuguese ? 'Tecnologia Exclusiva' : 'Exclusive Technology'}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {isPortuguese ? 'Standard vs HD' : 'Standard vs HD'}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {isPortuguese 
              ? 'Escolha o formato ideal para suas necessidades. O modo HD utiliza inteligência artificial para melhorar a qualidade de cada etiqueta.'
              : 'Choose the ideal format for your needs. HD mode uses artificial intelligence to enhance each label\'s quality.'}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
          <ComparisonCard type="standard" isPortuguese={isPortuguese} />
          <ComparisonCard type="hd" isPortuguese={isPortuguese} />
        </div>

        <div className="mt-12 text-center">
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {isPortuguese 
              ? 'O processamento HD usa IA para upscaling inteligente de cada etiqueta'
              : 'HD processing uses AI for intelligent upscaling of each label'}
          </p>
        </div>
      </div>
    </section>
  );
};

export default ComparisonSection;
