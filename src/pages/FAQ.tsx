import { SEO } from "@/components/SEO";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useTranslation } from "react-i18next";
import { faqItems } from "@/components/landing/FAQSection";
import { memo, useEffect, useState } from "react";
import { Header } from "@/components/landing/Header";
import { supabase } from "@/integrations/supabase/client";

// Componente FAQ Item reutilizável
const FAQItem = memo(({ 
  item, 
  isPortuguese 
}: { 
  item: typeof faqItems[0], 
  isPortuguese: boolean 
}) => (
  <AccordionItem value={item.id}>
    <AccordionTrigger className="text-left">
      {isPortuguese ? item.questionPtBr : item.questionEn}
    </AccordionTrigger>
    <AccordionContent className="text-muted-foreground">
      {isPortuguese ? item.answerPtBr : item.answerEn}
    </AccordionContent>
  </AccordionItem>
));

const FAQ = () => {
  const { i18n } = useTranslation();
  const isPortuguese = i18n.language === 'pt-BR';
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };
    checkAuth();
  }, []);

  return (
    <div className="bg-gradient-to-b from-background to-muted/30 min-h-screen">
      <Header isLoggedIn={isLoggedIn} />
      <SEO 
        title={isPortuguese ? "FAQ – ZPL Easy" : "FAQ – ZPL Easy"}
        description={isPortuguese 
          ? "Perguntas frequentes sobre conversão ZPL, impressão de etiquetas, formatos suportados e como usar o ZPL Easy."
          : "Frequently asked questions about ZPL conversion, label printing, supported formats and how to use ZPL Easy."
        }
      />
      
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center">
          {isPortuguese ? 'Perguntas Frequentes' : 'Frequently Asked Questions'}
        </h1>
        
        <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
          {isPortuguese 
            ? 'Encontre respostas para as dúvidas mais comuns sobre o ZPL Easy e a conversão de etiquetas.'
            : 'Find answers to the most common questions about ZPL Easy and label conversion.'
          }
        </p>
        
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
    </div>
  );
};

export default FAQ;
