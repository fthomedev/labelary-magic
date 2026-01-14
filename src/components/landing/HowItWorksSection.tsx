import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { UserPlus, Upload, Download, ArrowRight } from 'lucide-react';

const ProcessStep = memo(({ 
  number, 
  icon, 
  titlePt, 
  titleEn, 
  descPt, 
  descEn, 
  isPortuguese,
  isLast 
}: {
  number: number;
  icon: React.ReactNode;
  titlePt: string;
  titleEn: string;
  descPt: string;
  descEn: string;
  isPortuguese: boolean;
  isLast?: boolean;
}) => (
  <div className="relative flex flex-col items-center text-center">
    {/* Step card */}
    <div className="bg-card border border-border/50 p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 w-full">
      {/* Number badge */}
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-8 bg-primary text-primary-foreground flex items-center justify-center rounded-full text-sm font-bold shadow-lg">
        {number}
      </div>
      
      {/* Icon */}
      <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary">
        {icon}
      </div>
      
      <h3 className="text-xl font-semibold mb-3">
        {isPortuguese ? titlePt : titleEn}
      </h3>
      <p className="text-muted-foreground leading-relaxed">
        {isPortuguese ? descPt : descEn}
      </p>
    </div>
    
    {/* Arrow connector (hidden on last item and mobile) */}
    {!isLast && (
      <div className="hidden md:flex absolute top-1/2 -right-8 transform -translate-y-1/2 text-primary/30">
        <ArrowRight className="w-8 h-8" />
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
      icon: <UserPlus className="w-10 h-10" />,
      titlePt: 'Crie sua conta grátis',
      titleEn: 'Create your free account',
      descPt: 'Cadastro rápido e sem custos. Comece em menos de 1 minuto.',
      descEn: 'Quick and free registration. Start in less than 1 minute.'
    },
    {
      number: 2,
      icon: <Upload className="w-10 h-10" />,
      titlePt: 'Envie seus arquivos ZPL',
      titleEn: 'Upload your ZPL files',
      descPt: 'Arraste e solte seus arquivos. Suportamos TXT, ZPL, ZIP e PDF.',
      descEn: 'Drag and drop your files. We support TXT, ZPL, ZIP and PDF.'
    },
    {
      number: 3,
      icon: <Download className="w-10 h-10" />,
      titlePt: 'Baixe o PDF em segundos',
      titleEn: 'Download PDF in seconds',
      descPt: 'Conversão instantânea. Pronto para imprimir em qualquer impressora.',
      descEn: 'Instant conversion. Ready to print on any printer.'
    }
  ];
  
  return (
    <section className="py-20 bg-muted/30" id="como-funciona">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            {isPortuguese ? 'Como Funciona' : 'How It Works'}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {isPortuguese 
              ? 'Converta ZPL em PDF em 3 Passos Simples' 
              : 'Convert ZPL to PDF in 3 Simple Steps'}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {isPortuguese 
              ? 'Sem instalação de software. Tudo online, rápido e seguro.' 
              : 'No software installation. Everything online, fast and secure.'}
          </p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-12 md:gap-16 max-w-5xl mx-auto relative">
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
