
import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';
import '../index.css';
import '../i18n/config';

export { render };

function render() {
  const rootElement = document.getElementById('root');
  if (!rootElement) throw new Error('Could not find root element');
  
  hydrateRoot(
    rootElement,
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}
