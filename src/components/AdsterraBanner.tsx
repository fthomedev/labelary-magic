import { useEffect, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

export function AdsterraBanner() {
  const isMobile = useIsMobile();
  const desktopRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);
  const desktopLoaded = useRef(false);
  const mobileLoaded = useRef(false);

  useEffect(() => {
    // Load desktop banner (728x90)
    if (desktopRef.current && !desktopLoaded.current) {
      desktopLoaded.current = true;
      
      const optionsScript = document.createElement('script');
      optionsScript.type = 'text/javascript';
      optionsScript.text = `
        atOptions = {
          'key' : '808f74ee81253f98eac20b3774c0604e',
          'format' : 'iframe',
          'height' : 90,
          'width' : 728,
          'params' : {}
        };
      `;
      
      const invokeScript = document.createElement('script');
      invokeScript.type = 'text/javascript';
      invokeScript.src = 'https://www.highperformanceformat.com/808f74ee81253f98eac20b3774c0604e/invoke.js';

      desktopRef.current.appendChild(optionsScript);
      desktopRef.current.appendChild(invokeScript);
    }
  }, []);

  useEffect(() => {
    // Load mobile banner (320x50)
    if (mobileRef.current && !mobileLoaded.current) {
      mobileLoaded.current = true;
      
      const optionsScript = document.createElement('script');
      optionsScript.type = 'text/javascript';
      optionsScript.text = `
        atOptions = {
          'key' : 'e0e59fcd3c3828b8f6644ab48a9e172d',
          'format' : 'iframe',
          'height' : 50,
          'width' : 320,
          'params' : {}
        };
      `;
      
      const invokeScript = document.createElement('script');
      invokeScript.type = 'text/javascript';
      invokeScript.src = 'https://www.highperformanceformat.com/e0e59fcd3c3828b8f6644ab48a9e172d/invoke.js';

      mobileRef.current.appendChild(optionsScript);
      mobileRef.current.appendChild(invokeScript);
    }
  }, []);

  return (
    <div className="w-full flex justify-center mb-4">
      {/* Desktop banner - hidden on mobile */}
      {!isMobile && (
        <div 
          ref={desktopRef}
          className="flex items-center justify-center"
          style={{ width: 728, height: 90 }}
        />
      )}
      {/* Mobile banner - visible only on mobile */}
      {isMobile && (
        <div 
          ref={mobileRef}
          className="flex items-center justify-center"
          style={{ width: 320, height: 50 }}
        />
      )}
    </div>
  );
}
