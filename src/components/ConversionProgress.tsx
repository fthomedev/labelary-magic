
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
    <div className="space-y-6">
      {isConverting && (
        <div className="space-y-4">
          <div className="overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
            <Progress value={progress} className="h-2 w-full bg-gradient-to-r from-cyan-500 to-blue-500" />
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            {t('processing')} {Math.round(progress)}%
          </p>
        </div>
      )}
      
      <div className="flex justify-center">
        <Button
          size="lg"
          onClick={onConvert}
          disabled={isConverting}
          className={`min-w-[200px] transition-all duration-200 ${
            isConverting 
              ? 'bg-gray-100 text-gray-500 dark:bg-gray-700'
              : progress === 0
              ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600'
              : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
          }`}
        >
          {isConverting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('converting')}
            </>
          ) : progress === 0 ? (
            <>
              <Play className="mr-2 h-4 w-4" />
              {t('process')}
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              {t('downloadComplete')}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
