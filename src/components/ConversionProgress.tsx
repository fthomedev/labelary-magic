
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Download, Loader2 } from 'lucide-react';

interface ConversionProgressProps {
  isConverting: boolean;
  progress: number;
  onConvert: () => void;
}

export const ConversionProgress = ({ isConverting, progress, onConvert }: ConversionProgressProps) => {
  return (
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
        onClick={onConvert}
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
    </div>
  );
};
