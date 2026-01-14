import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useIsMobile } from '@/hooks/use-mobile';
import { UserMenu } from '@/components/UserMenu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  isLoggedIn: boolean;
}

export const Header: React.FC<HeaderProps> = ({ isLoggedIn }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isPortuguese = i18n.language === 'pt-BR';

  const handleMyAccount = () => {
    navigate('/app');
  };

  const navLinks = [
    { href: '#como-funciona', labelPt: 'Como Funciona', labelEn: 'How It Works' },
    { href: '#beneficios', labelPt: 'Benefícios', labelEn: 'Benefits' },
    { href: '#faq', labelPt: 'FAQ', labelEn: 'FAQ' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <img src="/favicon.png" alt="ZPL Easy logo" className="h-7 w-7" />
          <span className="text-xl font-bold text-foreground">
            ZPL Easy
          </span>
        </a>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {isPortuguese ? link.labelPt : link.labelEn}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isLoggedIn ? (
            <>
              <Button 
                variant="default" 
                onClick={handleMyAccount}
                className="hidden sm:flex items-center gap-2"
                size="sm"
              >
                {isPortuguese ? 'Acessar App' : 'Go to App'}
              </Button>
              <UserMenu />
            </>
          ) : (
            <>
              <Button 
                variant="ghost" 
                onClick={() => navigate('/auth')}
                className="hidden sm:flex"
                size="sm"
              >
                {t('login')}
              </Button>
              <Button 
                onClick={() => navigate('/auth?signup=true')}
                className="hidden sm:flex"
                size="sm"
              >
                {isPortuguese ? 'Começar Grátis' : 'Start Free'}
              </Button>
              
              {/* Mobile menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild className="sm:hidden">
                  <Button variant="outline" size="icon">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {navLinks.map((link) => (
                    <DropdownMenuItem key={link.href} asChild>
                      <a href={link.href}>
                        {isPortuguese ? link.labelPt : link.labelEn}
                      </a>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem onClick={() => navigate('/auth')}>
                    {t('login')}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/auth?signup=true')}>
                    {isPortuguese ? 'Criar Conta' : 'Sign Up'}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
          <LanguageSelector />
        </div>
      </div>
    </header>
  );
};
