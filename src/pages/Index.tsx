
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileUpload } from '@/components/FileUpload';
import { ZPLPreview } from '@/components/ZPLPreview';
import { useToast } from '@/components/ui/use-toast';
import { ConversionProgress } from '@/components/ConversionProgress';
import { LanguageSelector } from '@/components/LanguageSelector';
import { UserMenu } from '@/components/UserMenu';
import { splitZPLIntoBlocks, delay, mergePDFs } from '@/utils/pdfUtils';

const Index = () => {
  const [zplContent, setZplContent] = useState<string>('');
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pdfUrls, setPdfUrls] = useState<string[]>([]);
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleFileSelect = (content: string) => {
    setZplContent(content);
    setPdfUrls([]);
  };

  const convertToPDF = async () => {
    try {
      setIsConverting(true);
      setProgress(0);
      setPdfUrls([]);

      const labels = splitZPLIntoBlocks(zplContent);
      const pdfs: Blob[] = [];
      const LABELS_PER_REQUEST = 14;
      const newPdfUrls: string[] = [];

      for (let i = 0; i < labels.length; i += LABELS_PER_REQUEST) {
        try {
          const blockLabels = labels.slice(i, i + LABELS_PER_REQUEST);
          const blockZPL = blockLabels.join('');

          const response = await fetch('https://api.labelary.com/v1/printers/8dpmm/labels/4x6/', {
            method: 'POST',
            headers: {
              'Accept': 'application/pdf',
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: blockZPL,
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const blob = await response.blob();
          pdfs.push(blob);

          const blockUrl = window.URL.createObjectURL(blob);
          newPdfUrls.push(blockUrl);

          setProgress(((i + blockLabels.length) / labels.length) * 100);

          if (i + LABELS_PER_REQUEST < labels.length) {
            await delay(3000);
          }
        } catch (error) {
          console.error(`${t('blockError')} ${i / LABELS_PER_REQUEST + 1}:`, error);
          toast({
            variant: "destructive",
            title: t('error'),
            description: t('blockErrorMessage', { block: i / LABELS_PER_REQUEST + 1 }),
          });
        }
      }

      setPdfUrls(newPdfUrls);

      if (pdfs.length > 0) {
        try {
          const mergedPdf = await mergePDFs(pdfs);
          const url = window.URL.createObjectURL(mergedPdf);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'etiquetas.pdf';
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);

          toast({
            title: t('success'),
            description: t('successMessage'),
          });
        } catch (error) {
          console.error('Erro ao mesclar PDFs:', error);
          toast({
            variant: "destructive",
            title: t('error'),
            description: t('mergePdfError'),
          });
        }
      } else {
        throw new Error("Nenhum PDF foi gerado com sucesso.");
      }
    } catch (error) {
      console.error('Erro na conversão:', error);
      toast({
        variant: "destructive",
        title: t('error'),
        description: t('errorMessage'),
      });
    } finally {
      setIsConverting(false);
      setProgress(0);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-background to-secondary/20">
      <header className="flex justify-between items-center px-4 py-3 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b">
        <h1 className="text-xl font-bold tracking-tight">
          {t('title')}
        </h1>
        <div className="flex items-center gap-2">
          <LanguageSelector />
          <UserMenu />
        </div>
      </header>

      <main className="flex-1 w-full p-4">
        <div className="container max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {t('subtitle')}
                </p>
                <FileUpload onFileSelect={handleFileSelect} />
              </div>
              
              {zplContent && (
                <div className="flex-1 min-h-0">
                  <ZPLPreview content={zplContent} />
                </div>
              )}
            </div>

            {zplContent && (
              <div className="flex flex-col">
                <ConversionProgress 
                  isConverting={isConverting}
                  progress={progress}
                  onConvert={convertToPDF}
                />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
