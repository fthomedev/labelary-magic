
import React from 'react';
import { Info } from 'lucide-react';
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { SampleZplDownload } from './SampleZplDownload';

export const ZPLInfoTooltip: React.FC = () => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex cursor-help">
            <Info className="h-4 w-4 text-blue-500" />
          </div>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs" side="right">
          <p className="text-sm">
            ZPL (Zebra Programming Language) é uma linguagem utilizada para definir formatação de etiquetas em impressoras térmicas.
          </p>
          <SampleZplDownload />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
