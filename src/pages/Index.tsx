
import { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { ZPLPreview } from '@/components/ZPLPreview';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';
import PDFMerger from 'pdf-merger-js';

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

  const splitZPLIntoBlocks = (zpl: string): string[] => {
    const labels = zpl.split('^XZ').filter(label => label.trim().includes('^XA'));
    const completeLabels = labels.map(label => `${label.trim()}^XZ`);
    return completeLabels;
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const mergePDFs = async (pdfBlobs: Blob[]): Promise<Blob> => {
    const merger = new PDFMerger();

    for (const blob of pdfBlobs) {
      const arrayBuffer = await blob.arrayBuffer();
      await merger.add(arrayBuffer);
    }

    const mergedPdf = await merger.saveAsBlob();
    return mergedPdf;
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
            
            <div className="mt-6 text-center">
              {isConverting && (
                <div className="mb-4">
                  <Progress value={progress} className="mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Processando... {Math.round(progress)}%
                  </p>
                </div>
              )}
              
              <Button
                size="lg"
                onClick={convertToPDF}
                disabled={isConverting}
                className="min-w-[200px] mb-6"
              >
                {isConverting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Convertendo...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Baixar PDF Completo
                  </>
                )}
              </Button>

              {pdfUrls.length > 0 && (
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
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
