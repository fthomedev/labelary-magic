import { useEffect, useRef } from 'react';

type AdConfig = {
  key: string;
  width: number;
  height: number;
};

// Top banner (desktop 468x60)
const DESKTOP_AD: AdConfig = {
  key: 'e2719207af9eb12b04d412caf1071e79',
  width: 468,
  height: 60,
};

// Mobile banner (320x50)
const MOBILE_AD: AdConfig = {
  key: 'e0e59fcd3c3828b8f6644ab48a9e172d',
  width: 320,
  height: 50,
};

function injectAd(
  container: HTMLDivElement,
  config: AdConfig,
  uniqueId: string
) {
  // Create isolated iframe to avoid atOptions conflicts
  const iframe = document.createElement('iframe');
  iframe.style.width = `${config.width}px`;
  iframe.style.height = `${config.height}px`;
  iframe.style.border = 'none';
  iframe.style.overflow = 'hidden';
  iframe.scrolling = 'no';
  iframe.id = uniqueId;

  container.appendChild(iframe);

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
            'key' : '${config.key}',
            'format' : 'iframe',
            'height' : ${config.height},
            'width' : ${config.width},
            'params' : {}
          };
        </script>
        <script type="text/javascript" src="https://www.highperformanceformat.com/${config.key}/invoke.js"></script>
      </body>
    </html>
  `);
  iframeDoc.close();
}

export function AdsterraBanner() {
  const desktopRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);
  const desktopLoaded = useRef(false);
  const mobileLoaded = useRef(false);

  useEffect(() => {
    const isDesktop = window.innerWidth >= 768;

    if (isDesktop && desktopRef.current && !desktopLoaded.current) {
      desktopLoaded.current = true;
      injectAd(desktopRef.current, DESKTOP_AD, 'adsterra-top-desktop');
    }

    if (!isDesktop && mobileRef.current && !mobileLoaded.current) {
      mobileLoaded.current = true;
      injectAd(mobileRef.current, MOBILE_AD, 'adsterra-top-mobile');
    }
  }, []);

  return (
    <div className="w-full flex justify-center mb-4" aria-label="Publicidade">
      <div
        ref={desktopRef}
        className="hidden md:flex items-center justify-center"
        style={{ width: DESKTOP_AD.width, height: DESKTOP_AD.height }}
      />
      <div
        ref={mobileRef}
        className="flex md:hidden items-center justify-center"
        style={{ width: MOBILE_AD.width, height: MOBILE_AD.height }}
      />
    </div>
  );
}
