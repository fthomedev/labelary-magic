import { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { ZPLPreview } from '@/components/ZPLPreview';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';

const Index = () => {
  const [zplContent, setZplContent] = useState<string>('');
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleFileSelect = (content: string) => {
    setZplContent(content);
  };

  const splitZPLIntoBlocks = (zpl: string): string[] => {
    // Divide o conteúdo ZPL em etiquetas individuais
    const labels = zpl.split('^XZ').filter(label => label.trim().includes('^XA'));
    const blocks: string[] = [];
    const LABELS_PER_BLOCK = 14;

    // Agrupa as etiquetas em blocos de 14
    for (let i = 0; i < labels.length; i += LABELS_PER_BLOCK) {
      const block = labels.slice(i, i + LABELS_PER_BLOCK)
        .map(label => `${label.trim()}^XZ`)
        .join('');
      if (block) blocks.push(block);
    }

    return blocks;
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const convertToPDF = async () => {
    try {
      setIsConverting(true);
      setProgress(0);

      const blocks = splitZPLIntoBlocks(zplContent);
      const pdfs: Blob[] = [];

      for (let i = 0; i < blocks.length; i++) {
        try {
          const response = await fetch('https://api.labelary.com/v1/printers/8dpmm/labels/4x6/', {
            method: 'POST',
            headers: {
              'Accept': 'application/pdf',
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: blocks[i],
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const blob = await response.blob();
          pdfs.push(blob);

          // Atualiza o progresso
          setProgress(((i + 1) / blocks.length) * 100);

          // Aguarda 10 segundos entre as requisições
          if (i < blocks.length - 1) {
            await delay(10000);
          }
        } catch (error) {
          console.error(`Erro no bloco ${i + 1}:`, error);
          toast({
            variant: "destructive",
            title: "Erro",
            description: `Falha ao processar o bloco ${i + 1}. Tentando continuar com os próximos blocos...`,
          });
        }
      }

      if (pdfs.length > 0) {
        // Cria um novo Blob combinando todos os PDFs
        const finalPdf = new Blob(pdfs, { type: 'application/pdf' });
        const url = window.URL.createObjectURL(finalPdf);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'etiquetas.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: "Sucesso!",
          description: "PDF gerado com sucesso.",
        });
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
                className="min-w-[200px]"
              >
                {isConverting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Convertendo...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Baixar PDF
                  </>
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Index;