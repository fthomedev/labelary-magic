import { useEffect, useRef } from 'react';

// History banner (468x60)
const AD_CONFIG = {
  key: 'e2719207af9eb12b04d412caf1071e79',
  width: 468,
  height: 60,
};

export function AdsterraMediumRectangle() {
  const slotRef = useRef<HTMLDivElement>(null);
  const injectedRef = useRef(false);

  useEffect(() => {
    if (!slotRef.current || injectedRef.current) return;
    injectedRef.current = true;

    // Create isolated iframe to avoid atOptions conflicts with other banners
    const iframe = document.createElement('iframe');
    iframe.style.width = `${AD_CONFIG.width}px`;
    iframe.style.height = `${AD_CONFIG.height}px`;
    iframe.style.border = 'none';
    iframe.style.overflow = 'hidden';
    iframe.scrolling = 'no';
    iframe.id = 'adsterra-history-banner';

    slotRef.current.appendChild(iframe);

    const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iframeDoc) return;

    iframeDoc.open();
    iframeDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { margin: 0; padding: 0; overflow: hidden; }
          </style>
        </head>
        <body>
          <script type="text/javascript">
            atOptions = {
              'key' : '${AD_CONFIG.key}',
              'format' : 'iframe',
              'height' : ${AD_CONFIG.height},
              'width' : ${AD_CONFIG.width},
              'params' : {}
            };
          </script>
          <script type="text/javascript" src="https://www.highperformanceformat.com/${AD_CONFIG.key}/invoke.js"></script>
        </body>
      </html>
    `);
    iframeDoc.close();
  }, []);

  return (
    <div className="w-full flex justify-center py-3">
      <div 
        ref={slotRef} 
        className="flex items-center justify-center"
        style={{ width: AD_CONFIG.width, height: AD_CONFIG.height }}
      />
    </div>
  );
}
