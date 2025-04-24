
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
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
  },
  build: {
    rollupOptions: {
      output: {
        // Configure code splitting
        manualChunks: {
          // Vendor chunk for large external libraries
          vendor: [
            'react',
            'react-dom',
            'react-router-dom',
            '@tanstack/react-query',
          ],
          // UI components
          ui: [
            '@/components/ui',
          ],
          // i18n translations
          i18n: [
            'i18next',
            'react-i18next',
            './src/i18n/config',
            './src/i18n/locales',
          ],
          // Auth and Supabase
          auth: [
            '@supabase/supabase-js',
          ],
        },
      },
    },
    sourcemap: mode !== 'production',
    // Minimize chunks
    minify: 'terser',
    terserOptions: {
      compress: {
        // Remove console.log in production
        drop_console: mode === 'production',
      },
    },
  },
}));
