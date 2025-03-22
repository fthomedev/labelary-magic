
import { Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface PDFBlocksListProps {
  pdfUrls: string[];
}

export const PDFBlocksList = ({ pdfUrls }: PDFBlocksListProps) => {
  const { t } = useTranslation();
  
  if (pdfUrls.length === 0) return null;

  const handleView = (url: string) => {
    window.open(url, '_blank');
  };

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4">{t('pdfBlocks')}</h2>
      <div className="grid gap-2">
        {pdfUrls.map((url, index) => (
          <div key={index} className="flex flex-wrap gap-2">
            <a
              href={url}
              download={`etiquetas_bloco_${index + 1}.pdf`}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors"
            >
              <Download className="mr-2 h-4 w-4" />
              {t('downloadBlock', { number: index + 1 })}
            </a>
            <Button
              variant="outline"
              className="inline-flex items-center justify-center"
              onClick={() => handleView(url)}
            >
              <Eye className="mr-2 h-4 w-4" />
              {t('preview')}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
