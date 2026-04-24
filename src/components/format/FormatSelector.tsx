
import React, { useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { FileText, Sparkles, AlertTriangle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export type PrintFormat = 'standard' | 'hd';

interface FormatSelectorProps {
  selectedFormat: PrintFormat;
  onFormatChange: (format: PrintFormat) => void;
}

export function FormatSelector({ 
  selectedFormat, 
  onFormatChange
}: FormatSelectorProps) {
  const { t } = useTranslation();
  const [showWarning, setShowWarning] = useState(false);
  const [pendingFormat, setPendingFormat] = useState<PrintFormat | null>(null);
  const [resetKey, setResetKey] = useState(0);

  const handleFormatChange = (format: PrintFormat) => {
    if (format === 'hd') {
      setPendingFormat(format);
      setShowWarning(true);
    } else {
      onFormatChange(format);
    }
  };

  const handleConfirmHd = () => {
    if (pendingFormat) {
      onFormatChange(pendingFormat);
    }
    setShowWarning(false);
    setPendingFormat(null);
  };

  const handleCancelHd = () => {
    setShowWarning(false);
    setPendingFormat(null);
    // Force RadioGroup to re-render so visual selection matches actual state
    setResetKey(k => k + 1);
  };

  const handleWarningOpenChange = (open: boolean) => {
    setShowWarning(open);
    if (!open && pendingFormat) {
      // Dialog closed without confirming (cancel, ESC, click outside)
      setPendingFormat(null);
      setResetKey(k => k + 1);
    }
  };

  return (
    <>
      <div className="space-y-3">
        <div className="text-center">
          <h4 className="text-sm font-medium text-foreground mb-1">
            {t('printFormat')}
          </h4>
        </div>

        <RadioGroup 
          key={resetKey}
          value={selectedFormat} 
          onValueChange={handleFormatChange}
          className="grid grid-cols-2 gap-3 max-w-md mx-auto"
        >
          <Label
            htmlFor="standard"
            className={`relative flex items-center justify-center gap-2 rounded-lg border-2 p-3 cursor-pointer transition-all hover:border-primary/60 hover:bg-accent/50 ${
              selectedFormat === 'standard'
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border bg-background'
            }`}
          >
            <RadioGroupItem value="standard" id="standard" className="sr-only" />
            <FileText className={`h-4 w-4 ${selectedFormat === 'standard' ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`text-sm font-medium ${selectedFormat === 'standard' ? 'text-primary' : 'text-foreground'}`}>
              {t('standardFormat')}
            </span>
          </Label>

          <Label
            htmlFor="hd"
            className={`relative flex items-center justify-center gap-2 rounded-lg border-2 p-3 cursor-pointer transition-all hover:border-primary/60 hover:bg-accent/50 ${
              selectedFormat === 'hd'
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-border bg-background'
            }`}
          >
            <RadioGroupItem value="hd" id="hd" className="sr-only" />
            <Sparkles className={`h-4 w-4 ${selectedFormat === 'hd' ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`text-sm font-medium ${selectedFormat === 'hd' ? 'text-primary' : 'text-foreground'}`}>
              {t('hdFormat')}
            </span>
          </Label>
        </RadioGroup>
      </div>

      <AlertDialog open={showWarning} onOpenChange={handleWarningOpenChange}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              {t('hdFormatWarning')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('hdFormatWarningMessage')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelHd}>
              {t('cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmHd}>
              {t('confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
