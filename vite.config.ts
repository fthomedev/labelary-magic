
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
    outDir: "dist",
    // Ensure source maps are only generated in development
    sourcemap: mode !== 'production',
    // Add error and warning capture
    reportCompressedSize: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
      },
    },
    rollupOptions: {
      output: {
        // Configure code splitting
        manualChunks: (id) => {
          // Group React and related packages
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') || 
              id.includes('node_modules/scheduler')) {
            return 'vendor-react';
          }
          
          // Group Radix UI components
          if (id.includes('node_modules/@radix-ui')) {
            return 'vendor-radix';
          }
          
          // Group UI components
          if (id.includes('/src/components/ui/')) {
            return 'ui-components';
          }
          
          // Group i18n related packages
          if (id.includes('node_modules/i18next') || 
              id.includes('node_modules/react-i18next') ||
              id.includes('/src/i18n/')) {
            return 'i18n';
          }
          
          // Default chunking behavior for other modules
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
      },
    },
  },
}));
