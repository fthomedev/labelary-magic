
import React from 'react';
import { useTranslation } from 'react-i18next';

export const TestimonialsSection: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <section className="py-16 bg-white dark:bg-gray-900" id="depoimentos">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          {t('successStories')}
        </h2>
        
        <div className="max-w-3xl mx-auto bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
          <blockquote className="text-lg mb-4">
            "{t('testimonialText')}"
          </blockquote>
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-700 mr-3"></div>
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
