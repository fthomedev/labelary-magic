import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Cpu, Download, ArrowRight } from 'lucide-react';

interface StepProps {
  number: number;
  icon: React.ReactNode;
  titlePt: string;
  titleEn: string;
  descPt: string;
  descEn: string;
  isPortuguese: boolean;
  isLast?: boolean;
}

const ProcessStep = memo<StepProps>(({ number, icon, titlePt, titleEn, descPt, descEn, isPortuguese, isLast }) => (
  <div className="relative flex flex-col items-center text-center group">
    {/* Step number with icon */}
    <div className="relative mb-6">
      <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
        {icon}
      </div>
      <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
        {number}
      </div>
    </div>

    {/* Content */}
    <h3 className="text-xl font-bold text-foreground mb-3">
      {isPortuguese ? titlePt : titleEn}
    </h3>
    <p className="text-muted-foreground max-w-xs">
      {isPortuguese ? descPt : descEn}
    </p>

    {/* Connector arrow (hidden on mobile and last item) */}
    {!isLast && (
      <div className="hidden md:block absolute top-10 -right-8 text-border">
        <ArrowRight className="h-6 w-6" />
      </div>
    )}
  </div>
));

export const HowItWorksSection: React.FC = () => {
  const { i18n } = useTranslation();
  const isPortuguese = i18n.language === 'pt-BR';
  
  const steps = [
    {
      number: 1,
      icon: <Upload className="h-8 w-8" />,
      titlePt: 'Envie seu arquivo',
      titleEn: 'Upload your file',
      descPt: 'Arraste e solte arquivos ZPL, TXT ou ZIP. Aceita múltiplos arquivos de uma vez.',
      descEn: 'Drag and drop ZPL, TXT or ZIP files. Accepts multiple files at once.'
    },
    {
      number: 2,
      icon: <Cpu className="h-8 w-8" />,
      titlePt: 'Processamento com IA',
      titleEn: 'AI Processing',
      descPt: 'Escolha Standard para rapidez ou HD para qualidade superior com inteligência artificial.',
      descEn: 'Choose Standard for speed or HD for superior quality with artificial intelligence.'
    },
    {
      number: 3,
      icon: <Download className="h-8 w-8" />,
      titlePt: 'Baixe o PDF',
      titleEn: 'Download the PDF',
      descPt: 'Receba seu PDF otimizado para impressão. Pronto em segundos.',
      descEn: 'Receive your PDF optimized for printing. Ready in seconds.'
    }
  ];
  
  return (
    <section className="py-20 bg-card" id="como-funciona">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {isPortuguese ? 'Como Funciona' : 'How It Works'}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {isPortuguese 
              ? 'Converta suas etiquetas ZPL em PDF de alta qualidade em 3 passos simples'
              : 'Convert your ZPL labels to high-quality PDF in 3 simple steps'}
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-12 md:gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <ProcessStep 
              key={step.number}
              {...step}
              isPortuguese={isPortuguese}
              isLast={index === steps.length - 1}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
