
import { renderToString } from 'react-dom/server';
import { escapeInject, dangerouslySkipEscape } from 'vite-plugin-ssr/server';
import { StaticRouter } from 'react-router-dom/server';
import React from 'react';
import App from '../App';
import '../index.css';
import '../i18n/config';

export { render };

function render(pageContext: { urlPathname: string }) {
  const { urlPathname } = pageContext;
  
  const appHtml = renderToString(
    <StaticRouter location={urlPathname}>
      <App />
    </StaticRouter>
  );

  return escapeInject`<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>ZPL Easy</title>
        <meta name="description" content="ZPL Easy - ZPL to PDF Converter. Convert ZPL files to PDF quickly and securely online." />
        <meta name="author" content="Lovable" />
        <meta property="og:image" content="/og-image.png" />
        <meta property="og:title" content="ZPL Easy - ZPL to PDF Converter" />
        <meta property="og:description" content="Convert ZPL to PDF online. Easy to use, secure and fast. No installation required." />
        <meta property="og:url" content="https://zpleasy.com" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="robots" content="index, follow" />
      </head>
      <body>
        <div id="root">${dangerouslySkipEscape(appHtml)}</div>
        <script src="https://cdn.gpteng.co/gptengineer.js" type="module"></script>
      </body>
    </html>`;
}
