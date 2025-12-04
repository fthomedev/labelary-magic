
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from 'fs';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Check for SSL certificates
  const hasCerts = process.env.SSL_CERT_PATH && process.env.SSL_KEY_PATH && 
                  fs.existsSync(process.env.SSL_CERT_PATH) && 
                  fs.existsSync(process.env.SSL_KEY_PATH);
  
  // Default certificates in dev mode
  const devCerts = mode === 'development' && fs.existsSync('./ssl/cert.pem') && fs.existsSync('./ssl/key.pem');
  
  return {
    server: {
      host: "::",
      port: 8080,
      https: (hasCerts || devCerts) ? {
        cert: process.env.SSL_CERT_PATH || './ssl/cert.pem',
        key: process.env.SSL_KEY_PATH || './ssl/key.pem',
      } : undefined,
    },
    plugins: [
      react(),
      mode === 'development' &&
      componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      // Dedupe React to prevent multiple instances (fixes TensorFlow.js/UpscalerJS conflict)
      dedupe: ['react', 'react-dom'],
    },
    build: {
      rollupOptions: {
        output: {
          // Add hash to chunk filenames for cache busting
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        },
      },
      // Enable source maps for production
      sourcemap: true,
      // Configure asset handling
      assetsInlineLimit: 4096, // 4kb - files smaller than this will be inlined as base64
    },
  }
});
