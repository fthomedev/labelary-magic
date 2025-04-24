
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';
// Import i18n configuration before rendering to ensure it's initialized
import './i18n/config';

// Verify if the app is already hydrated (SSR)
const rootElement = document.getElementById('root');

if (!rootElement || rootElement.innerHTML === '') {
  // Client-side only rendering if not hydrated
  createRoot(rootElement!).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
} else {
  // If the app was server-rendered, use hydration
  console.log('Hydrating server-rendered content');
  import('./entry-client');
}
