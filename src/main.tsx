
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

// App import with proper type handling
const App = React.lazy(() => 
  import('./App')
    .then(module => {
      // Ensure we get a React component function back
      if (typeof module.default !== 'function') {
        throw new Error('App component is not a function');
      }
      return { default: module.default };
    })
    .catch(error => {
      console.error('Error loading App component:', error);
      return { 
        default: () => <div>Failed to load application</div> 
      };
    })
);

// Loading component
const LoadingFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="h-32 w-32 animate-pulse bg-primary/10 rounded-full"></div>
  </div>
);

const initializeApp = async () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Root element not found');
    return;
  }

  try {
    // Load i18n in a non-blocking way
    import('./i18n/config').catch(err => {
      console.warn('Non-critical i18n load error:', err);
    });

    // Render app with error boundary
    createRoot(rootElement).render(
      <React.StrictMode>
        <React.Suspense fallback={<LoadingFallback />}>
          <ErrorBoundary>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </ErrorBoundary>
        </React.Suspense>
      </React.StrictMode>
    );
  } catch (error) {
    console.error('Failed to initialize app:', error);
    document.getElementById('root')?.appendChild(
      document.createTextNode('Failed to initialize application')
    );
  }
};

// Simple error boundary component to catch render errors
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('Render error caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center flex-col p-4">
          <h2 className="text-xl font-bold mb-4">Something went wrong</h2>
          <button
            onClick={() => window.location.reload()}
            className="bg-primary text-primary-foreground px-4 py-2 rounded"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Initialize when the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
