
import React from 'react';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';

export const SampleZplDownload: React.FC = () => {
  const downloadSampleZpl = () => {
    // Sample ZPL content with two label formats
    const sampleZpl = `^XA
^FO50,50^A0N,50,50^FDSample Label 1^FS
^FO50,120^BY3^BCN,100,Y,N,N^FD123456789012^FS
^FO50,250^A0N,30,30^FDTest Product^FS
^XZ
^XA
^FO50,50^A0N,50,50^FDSample Label 2^FS
^FO50,120^BY3^BCN,100,Y,N,N^FD987654321098^FS
^FO50,250^A0N,30,30^FDAnother Product^FS
^XZ`;
    
    const blob = new Blob([sampleZpl], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'sample.zpl';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <Button 
      variant="link" 
      className="p-0 h-auto text-xs text-blue-500 hover:text-blue-700 transition-colors duration-200" 
      onClick={downloadSampleZpl}
    >
      <FileDown className="h-3 w-3 mr-1" />
      Baixar arquivo ZPL de exemplo
    </Button>
  );
};
