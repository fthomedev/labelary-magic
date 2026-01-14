
import { SEO } from "@/components/SEO";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const FAQ = () => {
  return (
    <div className="bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-950">
      <SEO 
        title="FAQ – ZPL Easy"
        description="Perguntas frequentes sobre conversão ZPL, impressão e integrações."
      />
      
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center">
          Perguntas Frequentes
        </h1>
        
        <div className="max-w-3xl mx-auto mt-12">
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>
                O que é ZPL e por que preciso convertê-lo para PDF?
              </AccordionTrigger>
              <AccordionContent>
                ZPL (Zebra Programming Language) é uma linguagem de programação usada para criar etiquetas em impressoras térmicas Zebra. 
                Converter ZPL para PDF permite visualizar as etiquetas antes da impressão, compartilhar com pessoas sem impressoras térmicas, 
                ou arquivar etiquetas digitalmente.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-2">
              <AccordionTrigger>
                Como funciona o processo de conversão?
              </AccordionTrigger>
              <AccordionContent>
                Nosso sistema analisa o código ZPL, interpreta os comandos e renderiza uma representação visual precisa 
                da etiqueta em formato PDF. Todo o processamento acontece na nuvem, então você não precisa instalar 
                nenhum software ou driver.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-3">
              <AccordionTrigger>
                É possível fazer conversão em lote?
              </AccordionTrigger>
              <AccordionContent>
                Sim! Você pode enviar múltiplos arquivos ZPL ou um arquivo ZIP contendo vários arquivos ZPL para 
                conversão simultânea. Esta funcionalidade está disponível em nossos planos pagos.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-4">
              <AccordionTrigger>
                Como posso integrar com o meu sistema?
              </AccordionTrigger>
              <AccordionContent>
                Oferecemos uma API RESTful completa que permite integrar a conversão ZPL-PDF diretamente no seu sistema. 
                Consulte nossa documentação de API para detalhes sobre endpoints, autenticação e exemplos de código.
              </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="item-5">
              <AccordionTrigger>
                Vocês armazenam minhas etiquetas?
              </AccordionTrigger>
              <AccordionContent>
                Por padrão, mantemos as etiquetas convertidas por um período limitado para permitir que você as baixe novamente. 
                Nos planos premium, você pode configurar por quanto tempo deseja manter o histórico ou desativar completamente o armazenamento.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
