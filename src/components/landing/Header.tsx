
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useIsMobile } from '@/hooks/use-mobile';
import { UserMenu } from '@/components/UserMenu';

interface HeaderProps {
  isLoggedIn: boolean;
}

export const Header: React.FC<HeaderProps> = ({ isLoggedIn }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleMyAccount = () => {
    navigate('/app');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur dark:bg-gray-900/95 dark:border-gray-800">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          <span className="text-xl font-semibold truncate max-w-[200px] sm:max-w-none">
            ZPL Easy
          </span>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          {isLoggedIn ? (
            <>
              <Button 
                variant="outline" 
                onClick={handleMyAccount}
                className="hidden sm:flex items-center gap-2"
                size="sm"
              >
                <User size={16} />
                {t('myAccount')}
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
                {t('register')}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/auth')}
                className="sm:hidden"
              >
                <User size={16} />
              </Button>
            </>
          )}
          <LanguageSelector />
        </div>
      </div>
    </header>
  );
};
