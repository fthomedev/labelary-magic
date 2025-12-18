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
        'key' : 'dd8023f6133948c01724c154fc1d6843',
        'format' : 'iframe',
        'height' : 300,
        'width' : 160,
        'params' : {}
      };
    `;

    const invokeScript = document.createElement('script');
    invokeScript.type = 'text/javascript';
    invokeScript.src = 'https://www.highperformanceformat.com/dd8023f6133948c01724c154fc1d6843/invoke.js';

    slotRef.current.appendChild(optionsScript);
    slotRef.current.appendChild(invokeScript);
  }, []);

  return (
    <div className="w-full flex justify-center py-3">
      <div 
        ref={slotRef} 
        className="flex items-center justify-center"
        style={{ width: 160, height: 300 }}
      />
    </div>
  );
}
