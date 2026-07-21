import { defineConfig } from 'vite';
// @ts-ignore
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    watch: {
      usePolling: true, // Forzar a Vite a detectar cambios de código sobre volúmenes Docker
    },
    proxy: {
      '/api': {
        target: 'http://lab_backend_api:5000',
        changeOrigin: true,
        secure: false,
        // 🟢 Remueve '/api' de la URL antes de enviarla a Express
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});