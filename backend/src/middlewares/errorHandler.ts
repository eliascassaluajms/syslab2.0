// src/middlewares/errorHandler.ts
import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { AppError } from '../utils/appError.js';
export const errorHandler: ErrorRequestHandler = (err, req, res, next) => {
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