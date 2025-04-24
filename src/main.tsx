
import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
// Import i18n configuration before rendering to ensure it's initialized
import './i18n/config';

// Determine if we're running on the client
const isClient = typeof window !== 'undefined';

if (isClient) {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error('Root element not found!');
  } else {
    const hasPrerenderedContent = rootElement.innerHTML.trim().length > 0;
    
    if (hasPrerenderedContent) {
      // If there's pre-rendered content, hydrate it
      console.log('Hydrating server-rendered content');
      hydrateRoot(
        rootElement,
        <React.StrictMode>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </React.StrictMode>
      );
    } else {
      // If no pre-rendered content, do a full client-side render
      console.log('Performing client-side rendering');
      createRoot(rootElement).render(
        <React.StrictMode>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </React.StrictMode>
      );
    }
  }
}
