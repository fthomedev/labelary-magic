
import { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Check, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { findMissingKeys } from "@/i18n/config";

export const LanguageSelector = () => {
  const { i18n, t } = useTranslation();
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Mark component as mounted to avoid hydration issues
    setMounted(true);
    
    // Check for saved language
    const savedLanguage = localStorage.getItem('i18nextLng');
    if (savedLanguage && savedLanguage !== i18n.language) {
      i18n.changeLanguage(savedLanguage);
    }

    // In development mode, check for missing translations
    if (process.env.NODE_ENV === 'development') {
      const { enMissing, ptBRMissing } = findMissingKeys();
      if (enMissing.length > 0 || ptBRMissing.length > 0) {
        console.warn('Missing translations detected:');
        if (enMissing.length > 0) console.warn('Missing in English:', enMissing);
        if (ptBRMissing.length > 0) console.warn('Missing in Portuguese:', ptBRMissing);
      }
    }
  }, [i18n]);

  const handleLanguageChange = (value: string) => {
    if (i18n.language === value) return;
    
    i18n.changeLanguage(value);
    // Manual storage in case the i18n event doesn't trigger
    localStorage.setItem('i18nextLng', value);
    
    toast({
      title: value === 'pt-BR' ? 'Idioma alterado' : 'Language changed',
      description: value === 'pt-BR' ? 'Português selecionado' : 'English selected',
      duration: 2000
    });
  };

  // Only render content after initial mount to avoid hydration mismatch
  if (!mounted) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" aria-label={t('language')}>
          <Globe className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-background border">
        <DropdownMenuItem 
          onClick={() => handleLanguageChange('pt-BR')}
          className="cursor-pointer"
        >
          <div className="flex items-center justify-between w-full">
            <span>{t('portuguese')}</span>
            {i18n.language === 'pt-BR' && <Check className="h-4 w-4 ml-2" />}
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleLanguageChange('en')}
          className="cursor-pointer"
        >
          <div className="flex items-center justify-between w-full">
            <span>{t('english')}</span>
            {i18n.language === 'en' && <Check className="h-4 w-4 ml-2" />}
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
