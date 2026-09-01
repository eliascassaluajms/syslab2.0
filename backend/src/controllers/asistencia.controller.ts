import { NextFunction, Request, Response } from 'express';
import { asistenciaService } from '../services/asistencia.service.js';
import { AppError } from '../utils/appError.js';

export class AsistenciaController {
  async registrar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tokenQR, estudianteId } = req.body;

      if (!tokenQR || !estudianteId) {
        throw new AppError('Debe enviar los parámetros tokenQR y estudianteId.', 400);
      }

      const resultado = await asistenciaService.registrarAsistencia({
        tokenQR: String(tokenQR),
        estudianteId: Number(estudianteId),
      });

      res.status(200).json(resultado);
    } catch (error) {
      next(error);
    }
  }

  async listarPorSesion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { sesionId } = req.params;

      if (!sesionId || isNaN(Number(sesionId))) {
        throw new AppError('El parámetro sesionId es obligatorio y debe ser numérico.', 400);
      }

      const asistencias = await asistenciaService.listarPorSesion(Number(sesionId));

      res.status(200).json({
        status: 'success',
        results: asistencias.length,
        data: {
          total: asistencias.length,
          asistentes: asistencias,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const asistenciaController = new AsistenciaController();
