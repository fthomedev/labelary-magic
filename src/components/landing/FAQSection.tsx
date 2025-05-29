
import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

// Definição das perguntas para evitar re-renderizações desnecessárias
const faqItems = [
  {
    id: 'item-1',
    questionKey: 'faqWhatIsZpl',
    answerKey: 'faqWhatIsZplAnswer'
  },
  {
    id: 'item-2',
    questionKey: 'faqUseWithoutPrinter',
    answerKey: 'faqUseWithoutPrinterAnswer'
  },
  {
    id: 'item-3',
    questionKey: 'faqMarketplaceLabels',
    answerKey: 'faqMarketplaceLabelsAnswer'
  },
  {
    id: 'item-4',
    questionKey: 'faqPayToStart',
    answerKey: 'faqPayToStartAnswer'
  },
  {
    id: 'item-5',
    questionKey: 'faqPlatformSupport',
    answerKey: 'faqPlatformSupportAnswer'
  },
  {
    id: 'item-6',
    questionKey: 'faqWhyZplOverPdf',
    answerKey: 'faqWhyZplOverPdfAnswer'
  },
  {
    id: 'item-7',
    questionKey: 'faqPrinterCompatibility',
    answerKey: 'faqPrinterCompatibilityAnswer'
  },
  {
    id: 'item-8',
    questionKey: 'faqHowConversionWorks',
    answerKey: 'faqHowConversionWorksAnswer'
  }
];

// Componente FAQ otimizado com memo para evitar renderizações desnecessárias
const FAQItem = memo(({ 
  item, 
  t 
}: { 
  item: typeof faqItems[0], 
  t: (key: string) => string 
}) => (
  <AccordionItem value={item.id}>
    <AccordionTrigger>
      {t(item.questionKey)}
    </AccordionTrigger>
    <AccordionContent>
      {t(item.answerKey)}
    </AccordionContent>
  </AccordionItem>
));

// Componente principal com nome mais específico para melhor profiling
export const FAQSection: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <section className="py-20 bg-white dark:bg-gray-900" id="faq">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
          {t('faqTitle')}
        </h2>
        
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map(item => (
              <FAQItem 
                key={item.id}
                item={item}
                t={t}
              />
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};
