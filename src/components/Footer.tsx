
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export const Footer = () => {
  const { t } = useTranslation();
  
  return (
    <footer className="w-full py-12 px-4 bg-gray-900 text-gray-400 mt-auto">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-white font-semibold mb-4">ZPL Easy</h3>
            <p className="text-sm">
              A melhor plataforma para conversão de ZPL para PDF. Simples, rápido e seguro.
            </p>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm">
            <p>© {new Date().getFullYear()} ZPL Easy. {t('allRightsReserved')}</p>
          </div>
        </div>
      </div>
    </footer>
  );
};
