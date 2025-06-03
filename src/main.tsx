
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// Split App and i18n into separate chunks
const App = React.lazy(() => import('./App.tsx'));
const loadI18n = () => import('./i18n/config');

// Create loading component for better user experience
const LoadingFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="h-32 w-32 animate-pulse bg-primary/10 rounded-full" />
  </div>
);

// Initialize app with better error handling and code splitting
const initializeApp = async () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Root element not found');
    return;
  }

  try {
    // Initialize i18n first but don't block rendering
    loadI18n().catch(console.error);

    createRoot(rootElement).render(
      <React.StrictMode>
        <BrowserRouter>
          <React.Suspense fallback={<LoadingFallback />}>
            <App />
          </React.Suspense>
        </BrowserRouter>
      </React.StrictMode>
    );
  } catch (error) {
    console.error('Failed to initialize app:', error);
    document.getElementById('critical-content')?.classList.remove('opacity-0');
  }
};

// Start app when document is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
