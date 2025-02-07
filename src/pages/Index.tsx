
import { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { ZPLPreview } from '@/components/ZPLPreview';
import { useToast } from '@/components/ui/use-toast';
import { ConversionProgress } from '@/components/ConversionProgress';
import { PDFBlocksList } from '@/components/PDFBlocksList';
import { splitZPLIntoBlocks, delay, mergePDFs } from '@/utils/pdfUtils';

const Index = () => {
  const [zplContent, setZplContent] = useState<string>('');
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pdfUrls, setPdfUrls] = useState<string[]>([]);
  const { toast } = useToast();

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
            await delay(10000);
          }
        } catch (error) {
          console.error(`Erro no bloco ${i / LABELS_PER_REQUEST + 1}:`, error);
          toast({
            variant: "destructive",
            title: "Erro",
            description: `Falha ao processar o bloco ${i / LABELS_PER_REQUEST + 1}. Tentando continuar com os próximos blocos...`,
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
            title: "Sucesso!",
            description: "PDF consolidado gerado com sucesso.",
          });
        } catch (error) {
          console.error('Erro ao mesclar PDFs:', error);
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Não foi possível consolidar os PDFs. Por favor, tente novamente.",
          });
        }
      } else {
        throw new Error("Nenhum PDF foi gerado com sucesso.");
      }
    } catch (error) {
      console.error('Erro na conversão:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível converter o arquivo. Por favor, tente novamente.",
      });
    } finally {
      setIsConverting(false);
      setProgress(0);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-secondary/20">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            Conversor ZPL para PDF
          </h1>
          <p className="text-lg text-muted-foreground">
            Transforme seus arquivos ZPL em PDF com facilidade
          </p>
        </div>

        <FileUpload onFileSelect={handleFileSelect} />

        {zplContent && (
          <>
            <ZPLPreview content={zplContent} />
            <ConversionProgress 
              isConverting={isConverting}
              progress={progress}
              onConvert={convertToPDF}
            />
            <PDFBlocksList pdfUrls={pdfUrls} />
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
