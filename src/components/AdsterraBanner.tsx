import { useEffect, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

export function AdsterraBanner() {
  const containerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const scriptLoaded = useRef(false);

  useEffect(() => {
    if (!containerRef.current || scriptLoaded.current) return;

    // Clear container
    containerRef.current.innerHTML = '';

    // Create atOptions script
    const optionsScript = document.createElement('script');
    optionsScript.type = 'text/javascript';
    
    if (isMobile) {
      optionsScript.text = `
        atOptions = {
          'key' : 'e0e59fcd3c3828b8f6644ab48a9e172d',
          'format' : 'iframe',
          'height' : 50,
          'width' : 320,
          'params' : {}
        };
      `;
    } else {
      optionsScript.text = `
        atOptions = {
          'key' : '808f74ee81253f98eac20b3774c0604e',
          'format' : 'iframe',
          'height' : 90,
          'width' : 728,
          'params' : {}
        };
      `;
    }

    // Create invoke script
    const invokeScript = document.createElement('script');
    invokeScript.type = 'text/javascript';
    invokeScript.src = isMobile 
      ? 'https://www.highperformanceformat.com/e0e59fcd3c3828b8f6644ab48a9e172d/invoke.js'
      : 'https://www.highperformanceformat.com/808f74ee81253f98eac20b3774c0604e/invoke.js';

    containerRef.current.appendChild(optionsScript);
    containerRef.current.appendChild(invokeScript);
    scriptLoaded.current = true;
  }, [isMobile]);

  return (
    <div className="w-full flex justify-center mb-4">
      <div 
        ref={containerRef}
        className={`flex items-center justify-center ${isMobile ? 'min-h-[50px]' : 'min-h-[90px]'}`}
      />
    </div>
  );
}
