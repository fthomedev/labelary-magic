
import React from 'react';
import { useTranslation } from 'react-i18next';

export const TestimonialsSection: React.FC = () => {
  const { i18n } = useTranslation();
  
  return (
    <section className="py-20 bg-white dark:bg-gray-900" id="depoimentos">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
          {i18n.language === 'pt-BR' ? 'Histórias de Sucesso' : 'Success Stories'}
        </h2>
        
        <div className="max-w-3xl mx-auto bg-gray-50 dark:bg-gray-800 p-8 rounded-xl relative">
          <div className="text-5xl text-primary/20 absolute top-4 left-4">"</div>
          <blockquote className="text-lg mb-6 relative z-10">
            {i18n.language === 'pt-BR' 
              ? '"Economizamos horas de trabalho por semana ao migrar nosso fluxo de impressão para a ferramenta de conversão ZPL para PDF. A interface é simples e a velocidade impressiona!"' 
              : '"We save hours of work per week by migrating our printing workflow to the ZPL to PDF conversion tool. The interface is simple and the speed is impressive!"'}
          </blockquote>
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-700 mr-4"></div>
            <div>
              <p className="font-semibold">LogisTech Solutions</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">E-commerce Logistics</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
