import React from 'react';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, Truck, Printer, Sparkles, Cloud, Shield } from 'lucide-react';

interface BenefitCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const BenefitCard: React.FC<BenefitCardProps> = ({ icon, title, description }) => (
  <div className="group p-6 bg-card rounded-2xl border border-border/50 hover:border-primary/30 hover:shadow-xl transition-all duration-300">
    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
      {icon}
    </div>
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
  </div>
);

export const BenefitsSection: React.FC = () => {
  const { i18n } = useTranslation();
  const isPt = i18n.language === 'pt-BR';
  
  const benefits = [
    {
      icon: <ShoppingCart className="w-6 h-6" />,
      title: isPt ? 'E-commerce' : 'E-commerce',
      description: isPt 
        ? 'Imprima etiquetas do Mercado Livre, Shopee, Amazon e outros marketplaces em qualquer impressora.' 
        : 'Print labels from Mercado Livre, Shopee, Amazon and other marketplaces on any printer.'
    },
    {
      icon: <Truck className="w-6 h-6" />,
      title: isPt ? 'Logística' : 'Logistics',
      description: isPt 
        ? 'Processe lotes de etiquetas de transportadoras como Correios, Total Express e Loggi.' 
        : 'Process batches of carrier labels from Correios, Total Express and Loggi.'
    },
    {
      icon: <Printer className="w-6 h-6" />,
      title: isPt ? 'Qualquer Impressora' : 'Any Printer',
      description: isPt 
        ? 'Não precisa de impressora Zebra. Visualize e imprima em qualquer impressora comum.' 
        : 'No Zebra printer needed. View and print on any regular printer.'
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: isPt ? 'Nitidez+ com IA' : 'Sharpness+ with AI',
      description: isPt 
        ? 'Códigos de barras mais nítidos e legíveis através de processamento com inteligência artificial.' 
        : 'Sharper, more readable barcodes through AI processing.'
    },
    {
      icon: <Cloud className="w-6 h-6" />,
      title: isPt ? '100% Online' : '100% Online',
      description: isPt 
        ? 'Sem instalação de software. Acesse de qualquer lugar, a qualquer momento.' 
        : 'No software installation. Access from anywhere, anytime.'
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: isPt ? 'Seguro e Privado' : 'Secure & Private',
      description: isPt 
        ? 'Seus arquivos são processados com segurança e excluídos automaticamente após 60 dias.' 
        : 'Your files are processed securely and automatically deleted after 60 days.'
    }
  ];
  
  return (
    <section className="py-20 bg-background" id="beneficios">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            {isPt ? 'Casos de Uso' : 'Use Cases'}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {isPt ? 'Perfeito para Seu Negócio' : 'Perfect for Your Business'}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {isPt 
              ? 'Seja você um vendedor individual ou uma grande operação logística, nossa ferramenta se adapta às suas necessidades.' 
              : 'Whether you\'re an individual seller or a large logistics operation, our tool adapts to your needs.'}
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => (
            <BenefitCard key={index} {...benefit} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
