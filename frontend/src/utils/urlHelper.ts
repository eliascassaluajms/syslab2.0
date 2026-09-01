export const getPublicAssetUrl = (path?: string | null): string => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;

  // 1. Obtener la URL base de la API configurada (ej. http://registrocitren.duckdns.org/api o http://200.87.27.36:5000/api)
  const apiUrl = import.meta.env.VITE_API_URL || '';

  let baseUrl = '';
  if (apiUrl) {
    // Elimina el sufijo /api para obtener el host raíz
    baseUrl = apiUrl.replace(/\/api\/?$/, '');
  } else {
    // Si no hay variable definida, toma el host del navegador
    const isStandardPort = window.location.port === '' || window.location.port === '80' || window.location.port === '443';
    baseUrl = isStandardPort 
      ? `${window.location.protocol}//${window.location.hostname}`
      : `${window.location.protocol}//${window.location.hostname}:5000`;
  }

  // 2. Limpieza de barras y prefijos duplicados
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};
