
import { useTranslation } from 'react-i18next';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Download, Loader2, Play } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ConversionProgressProps {
  isConverting: boolean;
  progress: number;
  onConvert: () => void;
  hasInterruptedConversion?: boolean;
  onResumeConversion?: () => void;
}

export const ConversionProgress = ({ 
  isConverting, 
  progress, 
  onConvert,
  hasInterruptedConversion,
  onResumeConversion
}: ConversionProgressProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  
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
          size={isMobile ? "sm" : "default"}
          onClick={hasInterruptedConversion && onResumeConversion ? onResumeConversion : onConvert}
          disabled={isConverting}
          className={`${isMobile ? 'w-full' : 'min-w-[180px]'} text-sm font-medium transition-all duration-300 shadow hover:shadow-hover btn-effect ${
            isConverting 
              ? 'bg-gray-100 text-gray-500 dark:bg-gray-700'
              : progress === 0
              ? 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600'
              : 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600'
          }`}
        >
          {isConverting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('converting')}
            </>
          ) : hasInterruptedConversion && onResumeConversion ? (
            <>
              <Play className="mr-2 h-4 w-4" />
              {t('resume')}
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
