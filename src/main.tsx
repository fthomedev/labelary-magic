
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { initializeI18n } from '@/i18n/config';
import App from './App';
import './index.css';

// Criar cliente de query global com configurações otimizadas
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos
    },
    mutations: {
      retry: 1,
    },
  },
});

// Função de inicialização global otimizada
const startApp = async () => {
  try {
    // Inicializar i18n de forma global e otimizada
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
    
    // Log de sucesso na inicialização
    console.log('Application started successfully');
    
  } catch (error) {
    console.error('Failed to start application:', error);
    
    // Fallback melhorado em caso de erro
    const rootElement = document.getElementById('root');
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="display: flex; justify-content: center; align-items: center; height: 100vh; font-family: Arial, sans-serif; background: #f5f5f5;">
          <div style="text-align: center; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #dc2626; margin-bottom: 1rem;">Erro ao carregar aplicação</h1>
            <p style="color: #6b7280; margin-bottom: 1.5rem;">Por favor, recarregue a página ou tente novamente.</p>
            <button 
              onclick="window.location.reload()" 
              style="
                padding: 12px 24px; 
                background: #059669; 
                color: white; 
                border: none; 
                border-radius: 6px; 
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
              "
            >
              Recarregar Página
            </button>
          </div>
        </div>
      `;
    }
  }
};

// Verificar se o DOM está carregado antes de inicializar
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startApp);
} else {
  startApp();
}
