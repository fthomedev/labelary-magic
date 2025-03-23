
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DownloadButtonProps {
  lastPdfUrl?: string;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({ lastPdfUrl }) => {
  const { t } = useTranslation();
  const [isAnimating, setIsAnimating] = useState(false);

  // Trigger animation when lastPdfUrl becomes available
  useEffect(() => {
    if (lastPdfUrl) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [lastPdfUrl]);

  const handleDownload = () => {
    if (lastPdfUrl) {
      const a = document.createElement('a');
      a.href = lastPdfUrl;
      a.download = 'etiquetas.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  if (!lastPdfUrl) return null;

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className={cn(
        "flex items-center gap-2 text-green-700 border-green-200 hover:bg-green-50 hover:text-green-800 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/30 dark:hover:text-green-300 w-full sm:w-auto justify-center font-medium active:scale-95 transition-all duration-300",
        isAnimating && "animate-pulse border-green-400 shadow-md shadow-green-300/20 dark:border-green-600 dark:shadow-green-900/30"
      )}
      onClick={handleDownload}
      aria-label={t('downloadAgain')}
    >
      <Download className={cn(
        "h-4 w-4",
        isAnimating && "animate-bounce"
      )} aria-hidden="true" />
      {t('downloadAgain')}
    </Button>
  );
};
