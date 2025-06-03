
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

// Componente para os itens do processo
const ProcessStep = memo(({ number, titlePt, titleEn, descPt, descEn, isPortuguese }: {
  number: number;
  titlePt: string;
  titleEn: string;
  descPt: string;
  descEn: string;
  isPortuguese: boolean;
}) => (
  <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl text-center">
    <div className="w-12 h-12 bg-primary/20 text-primary flex items-center justify-center rounded-full mx-auto mb-6 text-xl font-bold">
      {number}
    </div>
    <h3 className="text-xl font-semibold mb-4">
      {isPortuguese ? titlePt : titleEn}
    </h3>
    <p className="text-gray-600 dark:text-gray-300">
      {isPortuguese ? descPt : descEn}
    </p>
  </div>
));

export const HowItWorksSection: React.FC = () => {
  const { i18n } = useTranslation();
  const isPortuguese = i18n.language === 'pt-BR';
  
  // Pré-definir os steps para evitar cálculos de renderização
  const steps = [
    {
      number: 1,
      titlePt: 'Faça login ou crie sua conta',
      titleEn: 'Log in or create your account',
      descPt: 'Acesse nossa plataforma e autentique-se em segundos.',
      descEn: 'Access our platform and authenticate in seconds.'
    },
    {
      number: 2,
      titlePt: 'Envie seu arquivo ZPL',
      titleEn: 'Upload your ZPL file',
      descPt: 'Arraste e solte o arquivo ou selecione-o diretamente do seu computador.',
      descEn: 'Drag and drop the file or select it directly from your computer.'
    },
    {
      number: 3,
      titlePt: 'Baixe seu PDF',
      titleEn: 'Download your PDF',
      descPt: 'Em poucos segundos, receba o PDF pronto para impressão.',
      descEn: 'In seconds, receive the PDF ready for printing.'
    }
  ];
  
  return (
    <section className="py-20 bg-white dark:bg-gray-900" id="como-funciona">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
          {isPortuguese 
            ? 'Como Converter ZPL em PDF em 3 Passos Simples' 
            : 'How to Convert ZPL to PDF in 3 Simple Steps'}
        </h2>
        
        <div className="grid md:grid-cols-3 gap-10 max-w-5xl mx-auto">
          {steps.map((step) => (
            <ProcessStep 
              key={step.number}
              {...step}
              isPortuguese={isPortuguese}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
