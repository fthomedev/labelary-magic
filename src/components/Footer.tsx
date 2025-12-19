import { useTranslation } from "react-i18next";
import { DonationButton } from "./DonationButton";
import { useDonationCount } from "@/hooks/useDonationCount";
import { Heart } from "lucide-react";

export const Footer = () => {
  const { t } = useTranslation();
  const { data: donationCount = 0 } = useDonationCount();
  
  return (
    <footer className="w-full py-12 px-4 bg-gray-900 text-gray-400 mt-auto">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div>
            <h3 className="text-white font-semibold mb-4">ZPL Easy</h3>
            <p className="text-sm">
              {t('footerDescription')}
            </p>
          </div>
          
          <div className="flex flex-col items-center gap-3">
            <DonationButton />
            {donationCount > 0 && (
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" />
                <span>{donationCount} {donationCount === 1 ? t('supporter') : t('supporters')}</span>
              </div>
            )}
          </div>
          
          <div className="text-center md:text-right text-sm">
            <p>© {new Date().getFullYear()} ZPL Easy. {t('allRightsReserved')}</p>
          </div>
        </div>
      </div>
    </footer>
  );
};
