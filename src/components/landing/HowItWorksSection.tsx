
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';

// Componente para os itens do processo
const ProcessStep = memo(({ number, title, desc }: {
  number: number;
  title: string;
  desc: string;
}) => (
  <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl text-center">
    <div className="w-12 h-12 bg-primary/20 text-primary flex items-center justify-center rounded-full mx-auto mb-6 text-xl font-bold">
      {number}
    </div>
    <h3 className="text-xl font-semibold mb-4">
      {title}
    </h3>
    <p className="text-gray-600 dark:text-gray-300">
      {desc}
    </p>
  </div>
));

export const HowItWorksSection: React.FC = () => {
  const { t } = useTranslation();
  
  // Pré-definir os steps usando as chaves de tradução
  const steps = [
    {
      number: 1,
      title: t('stepLogin'),
      desc: t('stepLoginDesc')
    },
    {
      number: 2,
      title: t('stepUpload'),
      desc: t('stepUploadDesc')
    },
    {
      number: 3,
      title: t('stepDownload'),
      desc: t('stepDownloadDesc')
    }
  ];
  
  return (
    <section className="py-20 bg-white dark:bg-gray-900" id="como-funciona">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
          {t('howItWorks')}
        </h2>
        
        <div className="grid md:grid-cols-3 gap-10 max-w-5xl mx-auto">
          {steps.map((step) => (
            <ProcessStep 
              key={step.number}
              {...step}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
