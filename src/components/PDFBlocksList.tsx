
import { useState } from 'react';
import { Download, Eye, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from 'react-i18next';

interface PDFBlocksListProps {
  pdfUrls: string[];
}

export const PDFBlocksList = ({ pdfUrls }: PDFBlocksListProps) => {
  const { t } = useTranslation();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  
  if (pdfUrls.length === 0) return null;

  const handleView = (url: string) => {
    window.open(url, '_blank');
  };

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="mt-2">
      <h2 className="text-xl font-semibold mb-4">{t('pdfBlocks')}</h2>
      <div className="grid gap-4">
        {pdfUrls.map((url, index) => (
          <div key={index} className="border rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900">
            <div className="flex flex-wrap gap-2 p-3">
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
              <Button
                variant="ghost"
                size="icon"
                onClick={() => toggleExpand(index)}
                aria-label={expandedIndex === index ? "Fechar visualização" : "Abrir visualização"}
              >
                {expandedIndex === index ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
            
            {expandedIndex === index && (
              <div className="w-full h-[400px] border-t">
                <iframe 
                  src={url} 
                  title={`PDF Block ${index + 1}`} 
                  className="w-full h-full"
                  style={{ border: 'none' }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
