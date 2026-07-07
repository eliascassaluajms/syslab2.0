// src/middlewares/error.middleware.ts
import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '../utils/appError.js';

export const errorHandler: ErrorRequestHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // Modo Desarrollo dentro de Docker: Entregamos detalles completos del Stack Trace
  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack,
    });
    return;
  }

  // Modo Producción: Mensajes sanitizados y genéricos para seguridad institucional
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
    return;
  }

  // Errores imprevistos (Bugs, caídas de red, fallos físicos de DB)
  console.error('💥 ERROR NO CONTROLADO:', err);
  res.status(500).json({
    status: 'error',
    message: 'Algo salió muy mal en el servidor institucional. Contacte a soporte.',
  });
};