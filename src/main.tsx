
import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
// Import i18n configuration before rendering to ensure it's initialized
import './i18n/config'

// Ensure i18n is initialized before rendering
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
