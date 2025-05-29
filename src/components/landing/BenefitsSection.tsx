
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Zap, FileText, Check, Lock, BarChart } from 'lucide-react';

export const BenefitsSection: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <section className="py-20 bg-gray-50 dark:bg-gray-800" id="beneficios">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
          {t('benefitsTitle')}
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="mb-4 text-primary">
              <Zap className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {t('instantConversion')}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {t('instantConversionDesc')}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="mb-4 text-primary">
              <FileText className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {t('multipleFormats')}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {t('multipleFormatsDesc')}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="mb-4 text-primary">
              <Check className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {t('intuitiveInterface')}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {t('intuitiveInterfaceDesc')}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="mb-4 text-primary">
              <Lock className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {t('guaranteedSecurity')}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {t('guaranteedSecurityDesc')}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="mb-4 text-primary">
              <BarChart className="h-8 w-8" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {t('scalability')}
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              {t('scalabilityDesc')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
