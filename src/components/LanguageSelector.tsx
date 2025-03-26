
import { useEffect, useState } from "react";
import { useTranslation } from 'react-i18next';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Check, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

export const LanguageSelector = () => {
  const { i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Mark component as mounted to avoid hydration issues
    setMounted(true);
    
    // Check for saved language
    const savedLanguage = localStorage.getItem('i18nextLng');
    if (savedLanguage && savedLanguage !== i18n.language) {
      i18n.changeLanguage(savedLanguage);
    }
  }, [i18n]);

  const handleLanguageChange = (value: string) => {
    i18n.changeLanguage(value);
    // Manual storage in case the i18n event doesn't trigger
    localStorage.setItem('i18nextLng', value);
    
    // Force a page reload for components that might not listen to i18n events
    window.location.reload();
  };

  // Only render content after initial mount to avoid hydration mismatch
  if (!mounted) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Globe className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-background border">
        <DropdownMenuItem 
          onClick={() => handleLanguageChange('pt-BR')}
          className="cursor-pointer"
        >
          <div className="flex items-center justify-between w-full">
            <span>Português</span>
            {i18n.language === 'pt-BR' && <Check className="h-4 w-4 ml-2" />}
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleLanguageChange('en')}
          className="cursor-pointer"
        >
          <div className="flex items-center justify-between w-full">
            <span>English</span>
            {i18n.language === 'en' && <Check className="h-4 w-4 ml-2" />}
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
