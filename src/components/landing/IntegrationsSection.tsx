import React from 'react';
import { useTranslation } from 'react-i18next';
import { Package, Truck, Store, ShoppingBag, Box } from 'lucide-react';

interface IntegrationItemProps {
  name: string;
  icon?: React.ReactNode;
}

const IntegrationItem: React.FC<IntegrationItemProps> = ({ name, icon }) => (
  <div className="flex items-center gap-3 px-4 py-3 bg-card border border-border rounded-xl hover:shadow-md hover:border-primary/30 transition-all duration-300">
    <div className="p-2 bg-muted rounded-lg text-muted-foreground">
      {icon || <Store className="h-5 w-5" />}
    </div>
    <span className="font-medium text-foreground text-sm">{name}</span>
  </div>
);

export const IntegrationsSection: React.FC = () => {
  const { i18n } = useTranslation();
  const isPortuguese = i18n.language === 'pt-BR';

  const marketplaces = [
    { name: 'Mercado Livre', icon: <ShoppingBag className="h-5 w-5" /> },
    { name: 'Shopee', icon: <Store className="h-5 w-5" /> },
    { name: 'Amazon', icon: <Box className="h-5 w-5" /> },
    { name: 'Shopify', icon: <Store className="h-5 w-5" /> },
    { name: 'Nuvemshop', icon: <Store className="h-5 w-5" /> },
    { name: 'WooCommerce', icon: <Store className="h-5 w-5" /> },
  ];

  const logistics = [
    { name: 'Correios', icon: <Truck className="h-5 w-5" /> },
    { name: 'Total Express', icon: <Package className="h-5 w-5" /> },
    { name: 'Loggi', icon: <Truck className="h-5 w-5" /> },
    { name: 'Melhor Envio', icon: <Package className="h-5 w-5" /> },
    { name: 'Kangu', icon: <Truck className="h-5 w-5" /> },
    { name: 'Jadlog', icon: <Package className="h-5 w-5" /> },
  ];

  return (
    <section className="py-20 bg-muted/30" id="integracoes">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            {isPortuguese ? 'Compatível com as Principais Plataformas' : 'Compatible with Major Platforms'}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {isPortuguese 
              ? 'Funciona com etiquetas ZPL de qualquer marketplace ou transportadora'
              : 'Works with ZPL labels from any marketplace or carrier'}
          </p>
        </div>

        <div className="max-w-5xl mx-auto space-y-10">
          {/* Marketplaces */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              {isPortuguese ? 'Marketplaces e E-commerce' : 'Marketplaces & E-commerce'}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {marketplaces.map((item, index) => (
                <IntegrationItem key={index} name={item.name} icon={item.icon} />
              ))}
            </div>
          </div>

          {/* Logistics */}
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              {isPortuguese ? 'Transportadoras e Logística' : 'Carriers & Logistics'}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {logistics.map((item, index) => (
                <IntegrationItem key={index} name={item.name} icon={item.icon} />
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-muted-foreground mt-10 text-sm">
          {isPortuguese 
            ? '...e qualquer sistema que gere etiquetas em formato ZPL'
            : '...and any system that generates labels in ZPL format'}
        </p>
      </div>
    </section>
  );
};

export default IntegrationsSection;
