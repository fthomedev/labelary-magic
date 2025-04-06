
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

            <AccordionItem value="item-5">
              <AccordionTrigger>
                {i18n.language === 'pt-BR' 
                  ? '❓ Quais plataformas de marketplace e e-commerce utilizam etiquetas ZPL?' 
                  : '❓ Which marketplace and e-commerce platforms use ZPL labels?'}
              </AccordionTrigger>
              <AccordionContent>
                {i18n.language === 'pt-BR' 
                  ? 'Muitas plataformas populares de e-commerce e marketplace utilizam ou permitem a conversão de etiquetas para o formato ZPL (Zebra Programming Language), ideal para impressão em impressoras térmicas Zebra. Veja algumas:\n\nMercado Livre\n\nShopee\n\nAmazon (FBA/FBM)\n\nShopify (via apps como ShipStation e EasyPost)\n\nNuvemshop e Loja Integrada\n\nWooCommerce, Magento e PrestaShop\n\nGateways logísticos como Melhor Envio, Frenet, Intelipost, Kangu, Total Express, Loggi e Correios\n\nCom nossa ferramenta, você pode converter rapidamente etiquetas PDF para ZPL e imprimir direto em sua impressora térmica.'
                  : 'Many popular e-commerce and marketplace platforms use or allow the conversion of labels to ZPL format (Zebra Programming Language), ideal for printing on Zebra thermal printers. Here are some:\n\nMercado Livre\n\nShopee\n\nAmazon (FBA/FBM)\n\nShopify (via apps like ShipStation and EasyPost)\n\nNuvemshop and Loja Integrada\n\nWooCommerce, Magento, and PrestaShop\n\nLogistics gateways like Melhor Envio, Frenet, Intelipost, Kangu, Total Express, Loggi, and Correios\n\nWith our tool, you can quickly convert PDF labels to ZPL and print directly on your thermal printer.'}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-6">
              <AccordionTrigger>
                {i18n.language === 'pt-BR' 
                  ? '❓ Por que usar etiquetas ZPL em vez de PDF?' 
                  : '❓ Why use ZPL labels instead of PDF?'}
              </AccordionTrigger>
              <AccordionContent>
                {i18n.language === 'pt-BR' 
                  ? 'Etiquetas no formato ZPL são ideais para impressoras térmicas, especialmente da marca Zebra. Diferente do PDF, o ZPL é leve, rápido, e compatível com sistemas de automação. Isso significa:\n\nImpressão mais rápida\n\nMenor uso de memória da impressora\n\nMaior controle do layout e da qualidade da impressão\n\nRedução de erros em grandes volumes de etiquetas\n\nSe você trabalha com alto volume de pedidos, usar ZPL pode melhorar significativamente sua operação logística.'
                  : 'Labels in ZPL format are ideal for thermal printers, especially from Zebra. Unlike PDF, ZPL is lightweight, fast, and compatible with automation systems. This means:\n\nFaster printing\n\nLower printer memory usage\n\nGreater control over layout and print quality\n\nReduction of errors in large volumes of labels\n\nIf you work with high order volumes, using ZPL can significantly improve your logistics operation.'}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </section>
  );
};
