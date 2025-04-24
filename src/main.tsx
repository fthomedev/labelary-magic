
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// Improve code splitting with better chunking
const App = React.lazy(() => import('./App'));
const loadI18n = () => import('./i18n/config');

// Enhanced loading component with better UX
const LoadingFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="h-32 w-32 animate-pulse bg-primary/10 rounded-full" />
  </div>
);

// Improved initialization with progressive enhancement
const initializeApp = async () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Root element not found');
    return;
  }

  try {
    // Start loading i18n in parallel but don't block rendering
    const i18nPromise = loadI18n();

    // Render the app immediately
    createRoot(rootElement).render(
      <React.StrictMode>
        <BrowserRouter>
          <React.Suspense fallback={<LoadingFallback />}>
            <App />
          </React.Suspense>
        </BrowserRouter>
      </React.StrictMode>
    );

    // Wait for i18n in background
    await i18nPromise.catch(err => {
      console.warn('Non-critical i18n load error:', err);
    });
    
  } catch (error) {
    console.error('Failed to initialize app:', error);
    document.getElementById('critical-content')?.classList.remove('opacity-0');
  }
};

// Use requestIdleCallback for non-critical initialization when browser is idle
if ('requestIdleCallback' in window) {
  window.requestIdleCallback(() => {
    if (document.readyState === 'complete') {
      initializeApp();
    } else {
      window.addEventListener('load', initializeApp);
    }
  }, { timeout: 2000 });
} else {
  // Fallback for browsers without requestIdleCallback
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    initializeApp();
  }
}
