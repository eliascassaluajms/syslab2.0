import rateLimit from 'express-rate-limit';

// Limitador dinámico genérico para rutas públicas
export const publicRateLimiter = (maxRequests = 30, windowMs = 60 * 1000) =>
  rateLimit({
    windowMs,
    max: maxRequests,
    message: {
      status: 'fail',
      message: 'Demasiadas peticiones públicas enviadas desde esta IP. Intenta más tarde.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

// Limitador estricto para el endpoint pesado de OCR (Máx 6 intentos cada 10 minutos por IP)
export const ocrRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 6,
  message: {
    status: 'fail',
    message: 'Has superado el límite de intentos de escaneo de comprobante. Por favor, espera unos minutos o introduce el número manualmente.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limitador general para el registro de preinscripciones (Máx 15 registros cada 15 minutos por IP)
export const preinscripcionRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: {
    status: 'fail',
    message: 'Demasiadas solicitudes de inscripción desde esta conexión. Intenta más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
