import { useEffect, useRef } from 'react';

export function AdsterraMediumRectangle() {
  const slotRef = useRef<HTMLDivElement>(null);
  const injectedRef = useRef(false);

  useEffect(() => {
    if (!slotRef.current || injectedRef.current) return;
    injectedRef.current = true;

    const optionsScript = document.createElement('script');
    optionsScript.type = 'text/javascript';
    optionsScript.text = `
      atOptions = {
        'key' : 'e2719207af9eb12b04d412caf1071e79',
        'format' : 'iframe',
        'height' : 60,
        'width' : 468,
        'params' : {}
      };
    `;

    const invokeScript = document.createElement('script');
    invokeScript.type = 'text/javascript';
    invokeScript.src = 'https://www.highperformanceformat.com/e2719207af9eb12b04d412caf1071e79/invoke.js';

    slotRef.current.appendChild(optionsScript);
    slotRef.current.appendChild(invokeScript);
  }, []);

  return (
    <div className="w-full flex justify-center py-3">
      <div 
        ref={slotRef} 
        className="flex items-center justify-center"
        style={{ width: 468, height: 60 }}
      />
    </div>
  );
}
