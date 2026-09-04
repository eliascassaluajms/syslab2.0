import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {},
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: [
      '200.87.27.35',
      '200.87.27.36',
      'registrocitren.duckdns.org',
      'localhost',
      '127.0.0.1',
    ],
    watch: {
      usePolling: true, // Forzar a Vite a detectar cambios de código sobre volúmenes Docker
    },
    proxy: {
      '/api': {
        target: 'http://lab_backend_api:5000',
        changeOrigin: true,
        secure: false,
      },
      '/comprobantes': {
        target: 'http://lab_backend_api:5000',
        changeOrigin: true,
      },
    },
  },
});