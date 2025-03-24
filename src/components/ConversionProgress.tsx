
import { useTranslation } from 'react-i18next';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Download, Loader2, Play } from 'lucide-react';

interface ConversionProgressProps {
  isConverting: boolean;
  progress: number;
  onConvert: () => void;
}

export const ConversionProgress = ({ isConverting, progress, onConvert }: ConversionProgressProps) => {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-4">
      {isConverting && (
        <div className="space-y-3">
          <div className="overflow-hidden rounded-full bg-secondary">
            <Progress 
              value={progress} 
              className="h-2 w-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-300" 
            />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {t('processing')} {Math.round(progress)}%
          </p>
        </div>
      )}
      
      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={onConvert}
          disabled={isConverting}
          className={`w-full py-6 text-base font-medium transition-all duration-300 ${
            isConverting 
              ? 'bg-gray-100 text-gray-500 dark:bg-gray-700'
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {isConverting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              {t('converting')}
            </>
          ) : progress === 0 ? (
            <>
              <Play className="mr-2 h-5 w-5" />
              {t('process')}
            </>
          ) : (
            <>
              <Download className="mr-2 h-5 w-5" />
              {t('downloadComplete')}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
