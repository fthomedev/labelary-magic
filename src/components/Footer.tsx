import { useTranslation } from "react-i18next";
import { DonationButton } from "./DonationButton";
import { Zap } from "lucide-react";

export const Footer = () => {
  const { t } = useTranslation();
  
  return (
    <footer className="w-full py-12 px-4 bg-muted/50 border-t border-border mt-auto">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
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
          
          {/* Apoie */}
          <div className="flex flex-col items-center space-y-4">
            <h4 className="text-foreground font-medium">{t('supportProject')}</h4>
            <DonationButton />
          </div>
          
          {/* Copyright */}
          <div className="text-center md:text-right">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} ZPL Easy. {t('allRightsReserved')}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
