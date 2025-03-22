
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

interface DownloadButtonProps {
  lastPdfUrl?: string;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({ lastPdfUrl }) => {
  const { t } = useTranslation();

  const handleDownload = () => {
    if (lastPdfUrl) {
      const a = document.createElement('a');
      a.href = lastPdfUrl;
      a.download = 'etiquetas.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(lastPdfUrl);
      document.body.removeChild(a);
    }
  };

  return (
    <Button 
      variant="outline" 
      size="sm" 
      className="flex items-center gap-2 text-green-700 border-green-200 hover:bg-green-50 hover:text-green-800 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/30 dark:hover:text-green-300 w-full sm:w-auto justify-center font-medium active:scale-95 transition-transform duration-100"
      onClick={handleDownload}
      disabled={!lastPdfUrl}
      aria-label={t('downloadAgain')}
    >
      <Download className="h-4 w-4" aria-hidden="true" />
      {t('downloadAgain')}
    </Button>
  );
};
