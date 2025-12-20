
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
          value={selectedFormat} 
          onValueChange={handleFormatChange}
          className="flex items-center justify-center gap-6"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="standard" id="standard" />
            <Label htmlFor="standard" className="flex items-center gap-2 text-sm cursor-pointer">
              <FileText className="h-4 w-4" />
              {t('standardFormat')}
            </Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="hd" id="hd" />
            <Label htmlFor="hd" className="flex items-center gap-2 text-sm cursor-pointer">
              <Sparkles className="h-4 w-4" />
              {t('hdFormat')}
            </Label>
          </div>
        </RadioGroup>
      </div>

      <AlertDialog open={showWarning} onOpenChange={setShowWarning}>
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
