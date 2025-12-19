import { useEffect, useRef } from 'react';

type AdConfig = {
  key: string;
  width: number;
  height: number;
};

// Top banner (desktop) — script provided by you
const DESKTOP_AD: AdConfig = {
  key: 'e2719207af9eb12b04d412caf1071e79',
  width: 468,
  height: 60,
};

// Mobile banner
const MOBILE_AD: AdConfig = {
  key: 'e0e59fcd3c3828b8f6644ab48a9e172d',
  width: 320,
  height: 50,
};

function injectAd(
  target: React.RefObject<HTMLDivElement>,
  config: AdConfig,
  loadedRef: React.MutableRefObject<boolean>
) {
  if (!target.current || loadedRef.current) return;
  loadedRef.current = true;

  const optionsScript = document.createElement('script');
  optionsScript.type = 'text/javascript';
  optionsScript.text = `
    atOptions = {
      'key' : '${config.key}',
      'format' : 'iframe',
      'height' : ${config.height},
      'width' : ${config.width},
      'params' : {}
    };
  `;

  const invokeScript = document.createElement('script');
  invokeScript.type = 'text/javascript';
  invokeScript.src = `https://www.highperformanceformat.com/${config.key}/invoke.js`;

  target.current.appendChild(optionsScript);
  target.current.appendChild(invokeScript);
}

export function AdsterraBanner() {
  const desktopRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);
  const desktopLoaded = useRef(false);
  const mobileLoaded = useRef(false);

  useEffect(() => {
    const mql = window.matchMedia('(min-width: 768px)');

    const loadForBreakpoint = () => {
      if (mql.matches) {
        injectAd(desktopRef, DESKTOP_AD, desktopLoaded);
      } else {
        injectAd(mobileRef, MOBILE_AD, mobileLoaded);
      }
    };

    loadForBreakpoint();
    mql.addEventListener('change', loadForBreakpoint);
    return () => mql.removeEventListener('change', loadForBreakpoint);
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

