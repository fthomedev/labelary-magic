
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

export const Footer = () => {
  const { t } = useTranslation();
  
  return (
    <footer className="w-full py-12 px-4 bg-gray-900 text-gray-400 mt-auto">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-semibold mb-4">ZPL Easy</h3>
            <p className="text-sm">
              A melhor plataforma para conversão de ZPL para PDF. Simples, rápido e seguro.
            </p>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">Navegação</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link to="/app" className="hover:text-white transition-colors">App</Link></li>
              <li><Link to="/pricing" className="hover:text-white transition-colors">Planos</Link></li>
              <li><Link to="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">Desenvolvedores</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/docs" className="hover:text-white transition-colors">Documentação API</Link></li>
              <li><a href="https://status.zpleasy.com" className="hover:text-white transition-colors">Status</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-white font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Termos de Uso</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Política de Privacidade</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm">
          <p>© {new Date().getFullYear()} ZPL Easy. {t('allRightsReserved')}</p>
        </div>
      </div>
    </footer>
  );
};
