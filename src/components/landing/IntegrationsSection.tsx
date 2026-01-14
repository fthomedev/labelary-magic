import React from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';

interface IntegrationBadgeProps {
  name: string;
  category: string;
}

const IntegrationBadge: React.FC<IntegrationBadgeProps> = ({ name, category }) => (
  <div className="group relative flex flex-col items-center p-6 bg-card rounded-xl border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300 hover:scale-105">
    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-4 group-hover:from-primary/30 group-hover:to-primary/10 transition-colors">
      <span className="text-2xl font-bold text-primary">{name.charAt(0)}</span>
    </div>
    <span className="font-semibold text-center mb-1">{name}</span>
    <span className="text-xs text-muted-foreground">{category}</span>
    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
      <Check className="w-4 h-4" />
    </div>
  </div>
);

export const IntegrationsSection: React.FC = () => {
  const { i18n } = useTranslation();
  const isPt = i18n.language === 'pt-BR';

  const integrations = [
    { name: 'Mercado Livre', category: 'Marketplace' },
    { name: 'Shopee', category: 'Marketplace' },
    { name: 'Amazon', category: 'Marketplace' },
    { name: 'Magalu', category: 'Marketplace' },
    { name: 'Correios', category: isPt ? 'Transportadora' : 'Carrier' },
    { name: 'Total Express', category: isPt ? 'Transportadora' : 'Carrier' },
    { name: 'Loggi', category: isPt ? 'Transportadora' : 'Carrier' },
    { name: 'Melhor Envio', category: isPt ? 'Agregador' : 'Aggregator' },
  ];

  return (
    <section className="py-20 bg-background" id="integracoes">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
            {isPt ? 'Compatibilidade' : 'Compatibility'}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {isPt ? 'Funciona com Suas Plataformas Favoritas' : 'Works with Your Favorite Platforms'}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {isPt 
              ? 'Compatível com as principais plataformas de e-commerce e transportadoras do Brasil.' 
              : 'Compatible with major e-commerce platforms and carriers in Brazil.'}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-5xl mx-auto">
          {integrations.map((integration, index) => (
            <IntegrationBadge key={index} {...integration} />
          ))}
        </div>

        <div className="text-center mt-10">
          <p className="text-sm text-muted-foreground">
            {isPt 
              ? '+ qualquer etiqueta em formato ZPL padrão Zebra' 
              : '+ any label in standard Zebra ZPL format'}
          </p>
        </div>
      </div>
    </section>
  );
};

export default IntegrationsSection;
