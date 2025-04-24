
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle } from 'lucide-react';

export const FAQSection: React.FC = () => {
  const { i18n } = useTranslation();
  
  const faqItems = [
    {
      id: 'item-1',
      question: i18n.language === 'pt-BR' ? 'Preciso pagar algo para começar' : 'Do I need to pay anything to start',
      answer: i18n.language === 'pt-BR' 
        ? 'Você pode criar uma conta gratuita para testar a conversão. Consulte nossos planos premium para maior volume.' 
        : 'You can create a free account to test the conversion. Check our premium plans for higher volume.'
    },
    {
      id: 'item-2',
      question: i18n.language === 'pt-BR' ? 'É seguro enviar meus arquivos ZPL' : 'Is it safe to upload my ZPL files',
      answer: i18n.language === 'pt-BR' 
        ? 'Sim! Nossa plataforma utiliza protocolos de segurança avançados para proteger seus dados.' 
        : 'Yes! Our platform uses advanced security protocols to protect your data.'
    },
    {
      id: 'item-3',
      question: i18n.language === 'pt-BR' ? 'Posso converter vários arquivos ao mesmo tempo' : 'Can I convert multiple files at the same time',
      answer: i18n.language === 'pt-BR' 
        ? 'Sim! Oferecemos suporte a conversões em lote dependendo do plano escolhido.' 
        : 'Yes! We offer support for batch conversions depending on the chosen plan.'
    },
    {
      id: 'item-4',
      question: i18n.language === 'pt-BR' ? 'Há limite de tamanho de arquivo' : 'Is there a file size limit',
      answer: i18n.language === 'pt-BR' 
        ? 'Temos limites de acordo com cada plano. Consulte nossa documentação para mais detalhes.' 
        : 'We have limits according to each plan. Check our documentation for more details.'
    }
  ];

  return (
    <section className="py-20 bg-white dark:bg-gray-900" id="faq">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="flex justify-center items-center mb-4">
            <HelpCircle className="h-10 w-10 text-primary mr-3" />
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white">
              {i18n.language === 'pt-BR' ? 'Perguntas Frequentes' : 'Frequently Asked Questions'}
            </h2>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {i18n.language === 'pt-BR' 
              ? 'Encontre respostas para as dúvidas mais comuns sobre nossa plataforma de conversão ZPL' 
              : 'Find answers to the most common questions about our ZPL conversion platform'}
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqItems.map((item) => (
              <AccordionItem 
                key={item.id} 
                value={item.id} 
                className="border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <AccordionTrigger className="px-6 py-4 hover:no-underline text-lg font-medium text-gray-800 dark:text-white">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="px-6 py-4 text-gray-600 dark:text-gray-300">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

