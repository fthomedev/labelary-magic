
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export const FAQSection: React.FC = () => {
  const { i18n } = useTranslation();
  
  return (
    <section className="py-20 bg-white dark:bg-gray-900" id="faq">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
          {i18n.language === 'pt-BR' ? 'Perguntas Frequentes' : 'Frequently Asked Questions'}
        </h2>
        
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>
                {i18n.language === 'pt-BR' ? 'Preciso pagar algo para começar?' : 'Do I need to pay anything to start?'}
              </AccordionTrigger>
              <AccordionContent>
                {i18n.language === 'pt-BR' 
                  ? 'Você pode criar uma conta gratuita para testar a conversão. Consulte nossos planos premium para maior volume.' 
                  : 'You can create a free account to test the conversion. Check our premium plans for higher volume.'}
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2">
              <AccordionTrigger>
                {i18n.language === 'pt-BR' ? 'É seguro enviar meus arquivos ZPL?' : 'Is it safe to upload my ZPL files?'}
              </AccordionTrigger>
              <AccordionContent>
                {i18n.language === 'pt-BR' 
                  ? 'Sim! Nossa plataforma utiliza protocolos de segurança avançados para proteger seus dados.' 
                  : 'Yes! Our platform uses advanced security protocols to protect your data.'}
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3">
              <AccordionTrigger>
                {i18n.language === 'pt-BR' ? 'Posso converter vários arquivos ao mesmo tempo?' : 'Can I convert multiple files at the same time?'}
              </AccordionTrigger>
              <AccordionContent>
                {i18n.language === 'pt-BR' 
                  ? 'Sim! Oferecemos suporte a conversões em lote dependendo do plano escolhido.' 
                  : 'Yes! We offer support for batch conversions depending on the chosen plan.'}
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4">
              <AccordionTrigger>
                {i18n.language === 'pt-BR' ? 'Há limite de tamanho de arquivo?' : 'Is there a file size limit?'}
              </AccordionTrigger>
              <AccordionContent>
                {i18n.language === 'pt-BR' 
                  ? 'Temos limites de acordo com cada plano. Consulte nossa documentação para mais detalhes.' 
                  : 'We have limits according to each plan. Check our documentation for more details.'}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </section>
  );
};
