import { useTranslation } from "react-i18next";
import { DonationButton } from "./DonationButton";

export const Footer = () => {
  const { t } = useTranslation();
  
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
          </div>
          
          <div className="text-center md:text-right text-sm">
            <p>© {new Date().getFullYear()} ZPL Easy. {t('allRightsReserved')}</p>
          </div>
        </div>
      </div>
    </footer>
  );
};
