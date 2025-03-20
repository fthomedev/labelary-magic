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
  const [sourceType, setSourceType] = useState<'file' | 'zip'>('file');
  const [fileCount, setFileCount] = useState(1);
  const { toast } = useToast();
  const { t } = useTranslation();

  const handleFileSelect = (content: string, type: 'file' | 'zip' = 'file', count: number = 1) => {
    setZplContent(content);
    setPdfUrls([]);
    setSourceType(type);
    setFileCount(count);
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {t('title')}
            </h1>
            <div className="flex items-center gap-4">
              <LanguageSelector />
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <main className="py-10">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="px-4 sm:px-0">
            <h2 className="text-base font-semibold leading-7 text-gray-900 dark:text-gray-100">
              {t('subtitle')}
            </h2>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow">
                <div className="p-6">
                  <FileUpload onFileSelect={handleFileSelect} />
                </div>
              </div>
              
              {zplContent && (
                <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow">
                  <div className="p-6">
                    <ZPLPreview 
                      content={zplContent} 
                      sourceType={sourceType}
                      fileCount={fileCount}
                    />
                  </div>
                </div>
              )}
            </div>

            {zplContent && (
              <div className="overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow">
                <div className="p-6">
                  <ConversionProgress 
                    isConverting={isConverting}
                    progress={progress}
                    onConvert={convertToPDF}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
