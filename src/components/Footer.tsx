import { useTranslation } from "react-i18next";
import { DonationButton } from "./DonationButton";
import { Link } from "react-router-dom";
import { Mail, FileText, HelpCircle, CreditCard, Zap } from "lucide-react";

export const Footer = () => {
  const { t } = useTranslation();
  
  return (
    <footer className="w-full py-12 px-4 bg-muted/50 border-t border-border mt-auto">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              <h3 className="text-foreground font-semibold text-lg">ZPL Easy</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t('footerDescription')}
            </p>
          </div>
          
          {/* Links Úteis */}
          <div className="space-y-4">
            <h4 className="text-foreground font-medium">{t('usefulLinks')}</h4>
            <nav className="flex flex-col gap-2">
              <Link 
                to="/app" 
                className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                {t('converter')}
              </Link>
              <Link 
                to="/pricing" 
                className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
              >
                <CreditCard className="h-4 w-4" />
                {t('plans')}
              </Link>
              <Link 
                to="/faq" 
                className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
              >
                <HelpCircle className="h-4 w-4" />
                FAQ
              </Link>
            </nav>
          </div>
          
          {/* Contato */}
          <div className="space-y-4">
            <h4 className="text-foreground font-medium">{t('contact')}</h4>
            <a 
              href="mailto:contato@zpleasy.com" 
              className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              contato@zpleasy.com
            </a>
          </div>
          
          {/* Apoie */}
          <div className="space-y-4">
            <h4 className="text-foreground font-medium">{t('supportProject')}</h4>
            <DonationButton />
          </div>
        </div>
        
        {/* Copyright */}
        <div className="mt-10 pt-6 border-t border-border text-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} ZPL Easy. {t('allRightsReserved')}
          </p>
        </div>
      </div>
    </footer>
  );
};
