// src/middlewares/errorHandler.ts
import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { MulterError } from 'multer';
import { AppError } from '../utils/appError.js';
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  // Modo desarrollo: entregamos detalles completos del stack trace
  if (process.env.NODE_ENV === 'development' && !(err instanceof AppError) && !(err instanceof MulterError)) {
    res.status((err as AppError & { statusCode?: number }).statusCode || 500).json({
      status: 'error',
      error: err,
      message: (err as Error).message,
      stack: (err as Error).stack,
    });
    return;
  }

  if (err instanceof MulterError) {
    if (!req.complete) {
      req.resume();
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        status: 'fail',
        message: 'El archivo adjunto excede el tamaño máximo permitido (10 MB).',
      });
      return;
    }

    res.status(400).json({
      status: 'fail',
      message: 'No se pudo procesar el archivo adjunto.',
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: err.status, // Usa directamente el 'fail' o 'error' de su clase
      message: err.message,
    });
    return;
  }

  // Errores inesperados del sistema (No previstos/No operativos)
  console.error('💥 ERROR CRÍTICO:', err);
  
  res.status(500).json({
    status: 'error',
    message: 'Algo salió muy mal en el servidor.',
  });
};