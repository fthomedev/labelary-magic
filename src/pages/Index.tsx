
import { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { ZPLPreview } from '@/components/ZPLPreview';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const Index = () => {
  const [zplContent, setZplContent] = useState<string>('');
  const [isConverting, setIsConverting] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = (content: string) => {
    setZplContent(content);
  };

  const convertToPDF = async () => {
    try {
      setIsConverting(true);
      const response = await fetch('http://api.labelary.com/v1/printers/8dpmm/labels/4x6/0/', {
        method: 'POST',
        headers: {
          'Accept': 'application/pdf',
        },
        body: zplContent,
      });

      if (!response.ok) {
        throw new Error('Erro ao converter ZPL');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'etiqueta.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Sucesso!",
        description: "PDF gerado com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível converter o arquivo.",
      });
    } finally {
      setIsConverting(false);
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
