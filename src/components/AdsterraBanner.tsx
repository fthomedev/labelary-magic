import { useEffect, useRef } from 'react';

export function AdsterraBanner() {
  const desktopRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);
  const desktopLoaded = useRef(false);
  const mobileLoaded = useRef(false);

  useEffect(() => {
    // Load desktop banner (728x90)
    if (desktopRef.current && !desktopLoaded.current) {
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
      desktopLoaded.current = true;
    }

    // Load mobile banner (320x50)
    if (mobileRef.current && !mobileLoaded.current) {
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
      mobileLoaded.current = true;
    }
  }, []);

  return (
    <div className="w-full flex justify-center mb-4">
      {/* Desktop banner - hidden on mobile */}
      <div 
        ref={desktopRef}
        className="hidden md:flex items-center justify-center min-h-[90px]"
      />
      {/* Mobile banner - visible only on mobile */}
      <div 
        ref={mobileRef}
        className="flex md:hidden items-center justify-center min-h-[50px]"
      />
    </div>
  );
}
