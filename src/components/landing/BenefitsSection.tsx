
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Zap, FileText, Check, Lock, BarChart } from 'lucide-react';

export const BenefitsSection: React.FC = () => {
  const { i18n } = useTranslation();
  
  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-800" id="beneficios">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
          {i18n.language === 'pt-BR' ? 'Por que Escolher Nossa Ferramenta?' : 'Why Choose Our Tool?'}
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="mb-4 text-primary">
              <Zap className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {i18n.language === 'pt-BR' ? 'Conversão Instantânea' : 'Instant Conversion'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {i18n.language === 'pt-BR' 
                ? 'Processamento em nuvem, sem necessidade de instalar softwares adicionais.' 
                : 'Cloud processing, no need to install additional software.'}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="mb-4 text-primary">
              <FileText className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {i18n.language === 'pt-BR' ? 'Suporte a Múltiplos Formatos' : 'Support for Multiple Formats'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {i18n.language === 'pt-BR' 
                ? 'Compatível com versões diferentes de ZPL e gera PDFs de alta qualidade.' 
                : 'Compatible with different ZPL versions and generates high-quality PDFs.'}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="mb-4 text-primary">
              <Check className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {i18n.language === 'pt-BR' ? 'Interface Intuitiva' : 'Intuitive Interface'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {i18n.language === 'pt-BR' 
                ? 'Basta arrastar, soltar e converter. Sem curva de aprendizado.' 
                : 'Just drag, drop and convert. No learning curve.'}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="mb-4 text-primary">
              <Lock className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {i18n.language === 'pt-BR' ? 'Segurança Garantida' : 'Guaranteed Security'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {i18n.language === 'pt-BR' 
                ? 'Proteção dos seus dados e arquivos, com infraestrutura segura e confiável.' 
                : 'Protection of your data and files, with secure and reliable infrastructure.'}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="mb-4 text-primary">
              <BarChart className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {i18n.language === 'pt-BR' ? 'Escalabilidade' : 'Scalability'}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {i18n.language === 'pt-BR' 
                ? 'Perfeito para uso individual ou em grandes volumes de etiquetas.' 
                : 'Perfect for individual use or large volumes of labels.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
