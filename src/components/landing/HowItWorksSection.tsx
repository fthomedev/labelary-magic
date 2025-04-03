
import React from 'react';
import { useTranslation } from 'react-i18next';

export const HowItWorksSection: React.FC = () => {
  const { i18n } = useTranslation();
  
  return (
    <section className="py-20 bg-white dark:bg-gray-900" id="como-funciona">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
          {i18n.language === 'pt-BR' 
            ? 'Como Converter ZPL em PDF em 3 Passos Simples' 
            : 'How to Convert ZPL to PDF in 3 Simple Steps'}
        </h2>
        
        <div className="grid md:grid-cols-3 gap-10 max-w-5xl mx-auto">
          <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl text-center relative">
            <div className="w-12 h-12 bg-primary/20 text-primary flex items-center justify-center rounded-full mx-auto mb-6 text-xl font-bold">1</div>
            <h3 className="text-xl font-semibold mb-4">
              {i18n.language === 'pt-BR' ? 'Faça login ou crie sua conta' : 'Log in or create your account'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {i18n.language === 'pt-BR' 
                ? 'Acesse nossa plataforma e autentique-se em segundos.' 
                : 'Access our platform and authenticate in seconds.'}
            </p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl text-center">
            <div className="w-12 h-12 bg-primary/20 text-primary flex items-center justify-center rounded-full mx-auto mb-6 text-xl font-bold">2</div>
            <h3 className="text-xl font-semibold mb-4">
              {i18n.language === 'pt-BR' ? 'Envie seu arquivo ZPL' : 'Upload your ZPL file'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {i18n.language === 'pt-BR' 
                ? 'Arraste e solte o arquivo ou selecione-o diretamente do seu computador.' 
                : 'Drag and drop the file or select it directly from your computer.'}
            </p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-xl text-center">
            <div className="w-12 h-12 bg-primary/20 text-primary flex items-center justify-center rounded-full mx-auto mb-6 text-xl font-bold">3</div>
            <h3 className="text-xl font-semibold mb-4">
              {i18n.language === 'pt-BR' ? 'Baixe seu PDF' : 'Download your PDF'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {i18n.language === 'pt-BR' 
                ? 'Em poucos segundos, receba o PDF pronto para impressão.' 
                : 'In seconds, receive the PDF ready for printing.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
