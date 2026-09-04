// src/middlewares/errorHandler.ts
import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { MulterError } from 'multer';
import { AppError } from '../utils/appError.js';
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({
        status: 'fail',
        message: 'El archivo del extracto bancario excede el tamaño máximo permitido (10 MB).',
      });
      return;
    }

    res.status(400).json({
      status: 'fail',
      message: 'No se pudo procesar el archivo del extracto bancario.',
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