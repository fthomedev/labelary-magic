import { useEffect, useMemo, useRef, useState } from 'react';

function useMediaQuery(query: string) {
  const getInitial = () => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia(query).matches;
  };

  const [matches, setMatches] = useState<boolean>(getInitial);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);

    onChange();

    // Safari fallback
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyMql: any = mql;
    if (mql.addEventListener) mql.addEventListener('change', onChange);
    else if (anyMql.addListener) anyMql.addListener(onChange);

    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', onChange);
      else if (anyMql.removeListener) anyMql.removeListener(onChange);
    };
  }, [query]);

  return matches;
}

export function AdsterraBanner() {
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const slotRef = useRef<HTMLDivElement>(null);
  const injectedKeyRef = useRef<string | null>(null);
  const [scale, setScale] = useState(1);

  const config = useMemo(() => {
    return isDesktop
      ? {
          key: '808f74ee81253f98eac20b3774c0604e',
          width: 728,
          height: 90,
          src: 'https://www.highperformanceformat.com/808f74ee81253f98eac20b3774c0604e/invoke.js',
        }
      : {
          key: 'e0e59fcd3c3828b8f6644ab48a9e172d',
          width: 320,
          height: 50,
          src: 'https://www.highperformanceformat.com/e0e59fcd3c3828b8f6644ab48a9e172d/invoke.js',
        };
  }, [isDesktop]);

  useEffect(() => {
    if (!wrapperRef.current) return;

    const el = wrapperRef.current;
    const update = () => {
      const w = el.clientWidth || 0;
      const next = w > 0 ? Math.min(1, w / config.width) : 1;
      setScale(next);
    };

    update();

    const ro = new ResizeObserver(() => update());
    ro.observe(el);

    return () => ro.disconnect();
  }, [config.width]);

  useEffect(() => {
    if (!slotRef.current) return;
    if (injectedKeyRef.current === config.key) return;

    injectedKeyRef.current = config.key;
    slotRef.current.innerHTML = '';

    // Ensure global var exists before the invoke script loads
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).atOptions = {
      key: config.key,
      format: 'iframe',
      height: config.height,
      width: config.width,
      params: {},
    };

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
    invokeScript.src = config.src;

    slotRef.current.appendChild(optionsScript);
    slotRef.current.appendChild(invokeScript);
  }, [config.height, config.key, config.src, config.width]);

  return (
    <div className="w-full flex justify-center mb-4">
      <div ref={wrapperRef} className="w-full max-w-[728px] overflow-hidden">
        <div
          className="mx-auto"
          style={{
            height: config.height * scale,
            width: Math.min(config.width, (wrapperRef.current?.clientWidth ?? config.width)),
          }}
        >
          <div
            style={{
              width: config.width,
              height: config.height,
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
            }}
          >
            <div ref={slotRef} style={{ width: config.width, height: config.height }} />
          </div>
        </div>
      </div>
    </div>
  );
}

