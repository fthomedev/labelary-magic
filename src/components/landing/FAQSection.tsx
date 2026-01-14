import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { HelpCircle } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

// FAQ items organized by category importance
const faqItems = [
  // HD vs Standard - most important
  {
    id: 'item-hd',
    questionPtBr: 'Qual a diferença entre o formato Standard e HD?',
    questionEn: 'What is the difference between Standard and HD format?',
    answerPtBr: 'O formato Standard gera as etiquetas rapidamente. O formato HD (Alta Qualidade) utiliza inteligência artificial para melhorar a qualidade de cada etiqueta, resultando em impressões mais nítidas e códigos de barras mais legíveis. O processo HD leva mais tempo, mas oferece resultados superiores.',
    answerEn: 'Standard format generates labels quickly. HD (High Quality) format uses artificial intelligence to enhance each label\'s quality, resulting in sharper prints and more readable barcodes. The HD process takes longer but offers superior results.',
    category: 'general'
  },
  {
    id: 'item-free',
    questionPtBr: 'O ZPL Easy é gratuito?',
    questionEn: 'Is ZPL Easy free?',
    answerPtBr: 'Sim! O ZPL Easy é 100% gratuito, incluindo o modo HD com inteligência artificial. Mantemos a ferramenta através de doações voluntárias de usuários que desejam apoiar o projeto.',
    answerEn: 'Yes! ZPL Easy is 100% free, including HD mode with artificial intelligence. We keep the tool running through voluntary donations from users who want to support the project.',
    category: 'general'
  },
  {
    id: 'item-zpl',
    questionPtBr: 'O que é um arquivo ZPL?',
    questionEn: 'What is a ZPL file?',
    answerPtBr: 'ZPL (Zebra Programming Language) é uma linguagem usada para gerar etiquetas em impressoras Zebra e compatíveis. O conteúdo do arquivo ZPL define a estrutura da etiqueta (texto, QR code, códigos de barras, etc).',
    answerEn: 'ZPL (Zebra Programming Language) is a language used to generate labels for Zebra and compatible printers. The ZPL file content defines the label structure (text, QR codes, barcodes, etc).',
    category: 'technical'
  },
  {
    id: 'item-marketplaces',
    questionPtBr: 'Funciona com etiquetas da Shopee, Mercado Livre e outros?',
    questionEn: 'Does it work with Shopee, Mercado Livre and other labels?',
    answerPtBr: 'Sim! O ZPL Easy é compatível com etiquetas de qualquer marketplace: Mercado Livre, Shopee, Amazon, Shopify, e qualquer outro sistema que gere etiquetas em formato ZPL.',
    answerEn: 'Yes! ZPL Easy is compatible with labels from any marketplace: Mercado Livre, Shopee, Amazon, Shopify, and any other system that generates labels in ZPL format.',
    category: 'general'
  },
  {
    id: 'item-formats',
    questionPtBr: 'Quais formatos de arquivo posso enviar?',
    questionEn: 'What file formats can I upload?',
    answerPtBr: 'Aceitamos arquivos .txt contendo código ZPL, arquivos .zpl e arquivos .zip com múltiplos arquivos. Você pode enviar vários arquivos de uma vez e todos serão processados e combinados em um único PDF.',
    answerEn: 'We accept .txt files containing ZPL code, .zpl files, and .zip files with multiple files. You can upload multiple files at once and all will be processed and combined into a single PDF.',
    category: 'technical'
  },
  {
    id: 'item-security',
    questionPtBr: 'Meus dados estão seguros?',
    questionEn: 'Is my data secure?',
    answerPtBr: 'Sim! Utilizamos conexões seguras (HTTPS) e seus arquivos são processados de forma isolada. Não compartilhamos seus dados com terceiros e os registros são excluídos automaticamente após 60 dias.',
    answerEn: 'Yes! We use secure connections (HTTPS) and your files are processed in isolation. We don\'t share your data with third parties and records are automatically deleted after 60 days.',
    category: 'security'
  },
  {
    id: 'item-history',
    questionPtBr: 'Posso acessar meu histórico de conversões?',
    questionEn: 'Can I access my conversion history?',
    answerPtBr: 'Sim! Após fazer login, você tem acesso completo ao seu histórico de processamento por até 60 dias, podendo visualizar, baixar novamente ou excluir etiquetas convertidas.',
    answerEn: 'Yes! After logging in, you have full access to your processing history for up to 60 days, where you can view, re-download, or delete converted labels.',
    category: 'general'
  },
  {
    id: 'item-support',
    questionPtBr: 'Como posso apoiar o projeto?',
    questionEn: 'How can I support the project?',
    answerPtBr: 'Você pode nos apoiar com uma doação via PIX ou cartão de crédito. Cada contribuição ajuda a manter o ZPL Easy gratuito e em constante evolução!',
    answerEn: 'You can support us with a donation via PIX or credit card. Every contribution helps keep ZPL Easy free and constantly evolving.',
    category: 'general'
  }
];

const FAQItem = memo(({ 
  item, 
  isPortuguese 
}: { 
  item: typeof faqItems[0], 
  isPortuguese: boolean 
}) => (
  <AccordionItem value={item.id} className="border-b border-border">
    <AccordionTrigger className="text-left hover:no-underline py-5 text-foreground">
      {isPortuguese ? item.questionPtBr : item.questionEn}
    </AccordionTrigger>
    <AccordionContent className="text-muted-foreground pb-5">
      {isPortuguese ? item.answerPtBr : item.answerEn}
    </AccordionContent>
  </AccordionItem>
));

export const FAQSection: React.FC = () => {
  const { i18n } = useTranslation();
  const isPortuguese = i18n.language === 'pt-BR';
  
  return (
    <section className="py-20 bg-background" id="faq">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-full text-muted-foreground text-sm font-medium mb-4">
            <HelpCircle className="h-4 w-4" />
            {isPortuguese ? 'Dúvidas Frequentes' : 'Common Questions'}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {isPortuguese ? 'Perguntas Frequentes' : 'Frequently Asked Questions'}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {isPortuguese 
              ? 'Encontre respostas para as dúvidas mais comuns sobre o ZPL Easy'
              : 'Find answers to the most common questions about ZPL Easy'}
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map(item => (
              <FAQItem 
                key={item.id}
                item={item}
                isPortuguese={isPortuguese}
              />
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export { faqItems };
