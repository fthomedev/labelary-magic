
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// Lazy load App component
const App = React.lazy(() => import('./App.tsx'));

// Lazy load i18n configuration
const loadI18n = () => import('./i18n/config');

// Function to initialize the app
const initializeApp = async () => {
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    console.error('Root element not found!');
    return;
  }

  // Load i18n configuration after initial render
  await loadI18n();

  console.log('Performing client-side rendering');
  createRoot(rootElement).render(
    <React.StrictMode>
      <BrowserRouter>
        <React.Suspense fallback={
          <div className="flex items-center justify-center min-h-screen">
            <div className="h-32 w-32 animate-pulse bg-primary/10 rounded-full" />
          </div>
        }>
          <App />
        </React.Suspense>
      </BrowserRouter>
    </React.StrictMode>
  );
};

// Verify if the document has loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // If document is already loaded, initialize immediately
  initializeApp();
}

// Load non-critical CSS after initial content is displayed
window.addEventListener('load', () => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/src/index.css';
  document.head.appendChild(link);
});
