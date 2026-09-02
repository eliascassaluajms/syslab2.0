export const getPublicAssetUrl = (path?: string | null): string => {
  if (!path) return '';

  // 1. Eliminar cualquier prefijo rígido de localhost o 127.0.0.1 guardado previamente en BD
  let rutaLimpia = path.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, '');

  // 2. Corregir posibles duplicaciones de prefijos en la ruta relativa
  rutaLimpia = rutaLimpia.replace(/^\/api\/api\//, '/api/');
  rutaLimpia = rutaLimpia.startsWith('/') ? rutaLimpia : `/${rutaLimpia}`;

  // 3. Si es una URL externa legítima (S3, Cloudinary u otro servidor que no sea localhost), respetarla
  if (rutaLimpia.startsWith('http://') || rutaLimpia.startsWith('https://')) {
    return rutaLimpia;
  }

  // 4. Detectar dinámicamente el host real desde la barra de direcciones del navegador
  const hostname = window.location.hostname; // ej. registrocitren.duckdns.org, 200.87.27.36 o localhost
  const protocol = window.location.protocol;

  // Caso A: Si se accede a través del dominio DuckDNS (Nginx Proxy Manager maneja puertos 80/443)
  if (hostname.includes('duckdns.org')) {
    return `${protocol}//${hostname}${rutaLimpia}`;
  }

  // Caso B: Si se accede por IP pública o red local (el backend corre en el puerto 5000)
  const isDevLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const backendPort = isDevLocalhost ? '5000' : '5000';

  return `${protocol}//${hostname}:${backendPort}${rutaLimpia}`;
};
