import React from 'react';
import { useTranslation } from 'react-i18next';
import { HeroButtons } from './HeroButtons';
import { Sparkles, Zap, Shield } from 'lucide-react';

interface HeroSectionProps {
  isLoggedIn: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ isLoggedIn }) => {
  const { i18n } = useTranslation();
  const isPt = i18n.language === 'pt-BR';

  return (
    <section className="relative py-20 lg:py-28 overflow-hidden" id="hero-section">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-tr from-primary/15 to-transparent rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-5xl mx-auto">
          {/* Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
            <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-sm font-medium">
              <Shield className="w-4 h-4" />
              {isPt ? '100% Gratuito' : '100% Free'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium animate-pulse">
              <Sparkles className="w-4 h-4" />
              {isPt ? 'Novo: Nitidez+ com IA' : 'New: Sharpness+ with AI'}
            </span>
            <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium">
              <Zap className="w-4 h-4" />
              {isPt ? 'Conversão em Segundos' : 'Convert in Seconds'}
            </span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-foreground/80">
              {isPt ? 'Converta ZPL para PDF' : 'Convert ZPL to PDF'}
            </span>
            <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              {isPt ? 'em Segundos' : 'in Seconds'}
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl mb-6 text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {isPt 
              ? 'Ferramenta gratuita para visualizar e imprimir etiquetas de e-commerce. Compatível com Mercado Livre, Shopee, Amazon e mais.' 
              : 'Free tool to view and print e-commerce labels. Compatible with Mercado Livre, Shopee, Amazon and more.'}
          </p>

          {/* Feature highlights */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-10 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              {isPt ? 'Processamento em lote' : 'Batch processing'}
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              {isPt ? 'Multi-formato (TXT, ZPL, ZIP, PDF)' : 'Multi-format (TXT, ZPL, ZIP, PDF)'}
            </span>
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full" />
              {isPt ? 'Histórico 60 dias' : '60-day history'}
            </span>
          </div>

          {/* CTA Buttons */}
          <HeroButtons isLoggedIn={isLoggedIn} />

          {/* Marketplace Logos */}
          <div className="mt-14">
            <p className="text-sm text-muted-foreground mb-6">
              {isPt ? 'Compatível com as principais plataformas:' : 'Compatible with major platforms:'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 opacity-70 hover:opacity-100 transition-opacity">
              <MarketplaceLogo name="Mercado Livre" />
              <MarketplaceLogo name="Shopee" />
              <MarketplaceLogo name="Amazon" />
              <MarketplaceLogo name="Correios" />
              <MarketplaceLogo name="Magalu" />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const MarketplaceLogo: React.FC<{ name: string }> = ({ name }) => (
  <div className="flex items-center justify-center px-4 py-2 bg-card/50 dark:bg-card/30 rounded-lg border border-border/50 backdrop-blur-sm">
    <span className="text-sm font-medium text-muted-foreground">{name}</span>
  </div>
);
