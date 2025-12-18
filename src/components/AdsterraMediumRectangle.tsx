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
        'key' : '35fc031b245d16ebfc56ba72d35405bb',
        'format' : 'iframe',
        'height' : 250,
        'width' : 300,
        'params' : {}
      };
    `;

    const invokeScript = document.createElement('script');
    invokeScript.type = 'text/javascript';
    invokeScript.src = 'https://www.highperformanceformat.com/35fc031b245d16ebfc56ba72d35405bb/invoke.js';

    slotRef.current.appendChild(optionsScript);
    slotRef.current.appendChild(invokeScript);
  }, []);

  return (
    <div className="w-full flex justify-center py-3">
      <div 
        ref={slotRef} 
        className="flex items-center justify-center"
        style={{ width: 300, height: 250 }}
      />
    </div>
  );
}
