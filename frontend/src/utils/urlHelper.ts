/**
 * Utilidad para resolver URLs de comprobantes bancarios anteponiendo /api/
 * para que Nginx los derive al backend por el proxy existente de /api/.
 */
export const obtenerUrlComprobante = (urlRelativa?: string | null): string => {
  if (!urlRelativa) return '';

  const url = urlRelativa.trim();

  // Si ya es una URL absoluta completa (http:// o https://)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    // Si apunta a /comprobantes/ sin /api/, lo transformamos a /api/comprobantes/
    if (url.includes('/comprobantes/') && !url.includes('/api/comprobantes/')) {
      return url.replace('/comprobantes/', '/api/comprobantes/');
    }
    return url;
  }

  // Si es solo el nombre de archivo (ej. comprobante_123.jpg)
  if (!url.includes('/')) {
    const ruta = `/api/comprobantes/${url}`;
    const hostname = window.location.hostname;
    const port = window.location.port;
    if ((hostname === 'localhost' || hostname === '127.0.0.1') && port && port !== '80' && port !== '443') {
      return `http://${hostname}:5000${ruta}`;
    }
    return `${window.location.origin}${ruta}`;
  }

  // Si la ruta empieza con /comprobantes/ o comprobantes/
  let rutaLimpia = url;
  if (rutaLimpia.startsWith('/comprobantes/')) {
    rutaLimpia = rutaLimpia.replace('/comprobantes/', '/api/comprobantes/');
  } else if (rutaLimpia.startsWith('comprobantes/')) {
    rutaLimpia = `/api/${rutaLimpia}`;
  } else if (!rutaLimpia.startsWith('/api/')) {
    rutaLimpia = `/api${rutaLimpia.startsWith('/') ? '' : '/'}${rutaLimpia}`;
  }

  // Si estamos en desarrollo local con Vite (puerto 5173), apuntar al backend local en 5000
  const hostname = window.location.hostname;
  const port = window.location.port;
  if ((hostname === 'localhost' || hostname === '127.0.0.1') && port && port !== '80' && port !== '443') {
    return `http://${hostname}:5000${rutaLimpia}`;
  }

  return `${window.location.origin}${rutaLimpia}`;
};

export const getPublicAssetUrl = obtenerUrlComprobante;

