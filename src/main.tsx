
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { initializeI18n } from '@/i18n/config';
import App from './App';
import './index.css';

// Criar cliente de query global
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});

// Inicializar aplicação de forma otimizada
const startApp = async () => {
  try {
    // Inicializar i18n antes de renderizar a aplicação
    await initializeI18n();
    
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      throw new Error('Root element not found');
    }

    const root = createRoot(rootElement);
    
    root.render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </QueryClientProvider>
      </StrictMode>
    );
  } catch (error) {
    console.error('Failed to start application:', error);
    
    // Fallback em caso de erro
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif;">
          <div style="text-align: center;">
            <h1>Erro ao carregar aplicação</h1>
            <p>Por favor, recarregue a página.</p>
            <button onclick="window.location.reload()" style="padding: 10px 20px; margin-top: 10px;">
              Recarregar
            </button>
          </div>
        </div>
      `;
    }
  }
};

// Inicializar aplicação
startApp();
