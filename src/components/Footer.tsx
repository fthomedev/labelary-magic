
import { useTranslation } from "react-i18next";

export const Footer = () => {
  const { t } = useTranslation();
  
  return (
    <footer className="w-full py-4 px-4 bg-gray-900 text-gray-400 text-center text-sm mt-auto">
      <p>© {new Date().getFullYear()} ZPL Easy. {t('allRightsReserved')}</p>
    </footer>
  );
};
