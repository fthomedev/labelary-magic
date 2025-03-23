
import { Download } from 'lucide-react';

interface PDFBlocksListProps {
  pdfUrls: string[];
}

export const PDFBlocksList = ({ pdfUrls }: PDFBlocksListProps) => {
  if (pdfUrls.length === 0) return null;

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4">PDFs por Bloco</h2>
      <div className="grid gap-2">
        {pdfUrls.map((url, index) => (
          <a
            key={index}
            href={url}
            download={`etiquetas_bloco_${index + 1}.pdf`}
            className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors"
          >
            <Download className="mr-2 h-4 w-4" />
            Baixar Bloco {index + 1}
          </a>
        ))}
      </div>
    </div>
  );
};
