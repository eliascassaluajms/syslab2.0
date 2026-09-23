import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'node:path';

// Los navegadores (Android) renombran a .zip los archivos cuyo servidor no
// devuelve un Content-Type correcto. Aquí se sirven los binarios de descargas
// con MIME y Content-Disposition explícitos para conservar el nombre (.apk, etc.).
const descargasStatic = (): any => ({
  name: 'syslab-descargas-static',
  configureServer(server: any) {
    const mime: Record<string, string> = {
      '.apk': 'application/vnd.android.package-archive',
      '.exe': 'application/octet-stream',
      '.zip': 'application/zip',
      '.deb': 'application/octet-stream',
      '.AppImage': 'application/octet-stream',
    };
    server.middlewares.use((req: any, res: any, next: any) => {
      const url = (req.url || '').split('?')[0];
      if (!url.startsWith('/descargas/')) return next();
      const ext = path.extname(url);
      const contentType = mime[ext];
      if (!contentType) return next();
      const file = path.join(process.cwd(), 'public', url);
      if (!fs.existsSync(file)) return next();
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${path.basename(url)}"`);
      res.setHeader('Content-Length', fs.statSync(file).size);
      const stream = fs.createReadStream(file);
      stream.on('error', () => {
        res.statusCode = 500;
        res.end();
      });
      stream.pipe(res);
    });
  },
});

export default defineConfig({
  plugins: [react(), descargasStatic()],
  define: {
    'process.env': {},
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: [
      'syslab2026.duckdns.org',
      'registrocitren.duckdns.org',
      '.duckdns.org',          // Permite cualquier subdominio de DuckDNS
      '200.87.27.35',
      '200.87.27.36',
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
