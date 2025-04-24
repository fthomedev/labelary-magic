
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
// Importamos o CSS apenas depois que o conteúdo crítico já foi renderizado
import './i18n/config';

// Função para inicializar o app
const initializeApp = () => {
  const rootElement = document.getElementById('root');

  if (!rootElement) {
    console.error('Root element not found!');
    return;
  }

  console.log('Performing client-side rendering');
  createRoot(rootElement).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
};

// Verificar se o documento já foi carregado
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  // Se o documento já carregou, inicializar imediatamente
  initializeApp();
}

// Carregar o CSS não crítico somente após o conteúdo inicial ser exibido
window.addEventListener('load', () => {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/src/index.css';
  document.head.appendChild(link);
});
