
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface PdfViewerModalProps {
  pdfUrl: string | null;
  isOpen: boolean;
  onClose: () => void;
  onDownload: () => void;
  /** When a batch was split, all parts so the user can view/print each one. */
  parts?: { url: string; labelCount: number }[];
}

export function PdfViewerModal({ 
  pdfUrl, 
  isOpen, 
  onClose,
  onDownload,
  parts
}: PdfViewerModalProps) {
  const { t } = useTranslation();
  const [loaded, setLoaded] = useState(false);
  const [activePart, setActivePart] = useState(0);

  const hasParts = !!parts && parts.length > 1;
  const currentUrl = hasParts ? parts![Math.min(activePart, parts!.length - 1)].url : pdfUrl;

  useEffect(() => {
    if (isOpen) {
      setLoaded(false);
      setActivePart(0);
    }
  }, [isOpen, pdfUrl]);


  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[90vw] h-[90vh] max-h-[90vh] flex flex-col p-0" hideCloseButton>
        <DialogHeader className="px-4 py-2 border-b flex flex-row items-center justify-between">
          <DialogTitle className="text-lg">{t('viewPdf')}</DialogTitle>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
              onClick={onDownload}
            >
              <Download className="h-4 w-4" />
              {t('download')}
            </Button>
            <Button 
              variant="ghost" 
              size="icon"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">{t('close')}</span>
            </Button>
          </div>
        </DialogHeader>

        {hasParts && (
          <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2">
            <span className="text-xs text-muted-foreground">
              {t('pdfPartsHint', { count: parts!.length })}
            </span>
            {parts!.map((part, index) => (
              <Button
                key={part.url}
                variant={index === activePart ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  setLoaded(false);
                  setActivePart(index);
                }}
              >
                {t('pdfPartLabel', { number: index + 1 })}
              </Button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-auto p-0 bg-muted/20">
          {currentUrl && (
            <iframe 
              key={currentUrl}
              src={currentUrl} 
              className="w-full h-full border-0"
              onLoad={() => setLoaded(true)}
              title="PDF Viewer"
            />
          )}
          {!loaded && currentUrl && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
}
