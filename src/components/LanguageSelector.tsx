
import { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Check, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    const savedLanguage = localStorage.getItem('i18nextLng');
    if (savedLanguage && savedLanguage !== i18n.language) {
      i18n.changeLanguage(savedLanguage);
    }
  }, [i18n]);

  const handleLanguageChange = (value: string) => {
    if (i18n.language === value) return;
    
    i18n.changeLanguage(value);
    localStorage.setItem('i18nextLng', value);
  };

  if (!mounted) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          aria-label={i18n.language === 'pt-BR' ? 'Selecionar idioma' : 'Select language'}
        >
          <Globe className="h-4 w-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-background border">
        <DropdownMenuItem 
          onClick={() => handleLanguageChange('pt-BR')}
          className="cursor-pointer"
          role="menuitem"
        >
          <div className="flex items-center justify-between w-full">
            <span>Português</span>
            {i18n.language === 'pt-BR' && <Check className="h-4 w-4 ml-2" aria-hidden="true" />}
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleLanguageChange('en')}
          className="cursor-pointer"
          role="menuitem"
        >
          <div className="flex items-center justify-between w-full">
            <span>English</span>
            {i18n.language === 'en' && <Check className="h-4 w-4 ml-2" aria-hidden="true" />}
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
