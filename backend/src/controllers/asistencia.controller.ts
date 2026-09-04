import { NextFunction, Request, Response } from 'express';
import { EstadoAsistencia } from '@prisma/client';
import { asistenciaService } from '../services/asistencia.service.js';
import { AppError } from '../utils/appError.js';

export class AsistenciaController {
  async registrar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tokenQR, estudianteId } = req.body;

      if (!tokenQR || !estudianteId) {
        throw new AppError('Debe enviar los parámetros tokenQR y estudianteId.', 400);
      }

      const estudianteAutenticado = req.user?.id ? Number(req.user.id) : undefined;
      if (!estudianteAutenticado) {
        throw new AppError('Debe iniciar sesión como estudiante para registrar asistencia.', 401);
      }
      if (Number(estudianteId) !== estudianteAutenticado) {
        throw new AppError('No puede registrar asistencia en nombre de otro estudiante.', 403);
      }

      const resultado = await asistenciaService.registrarAsistencia({
        tokenQR: String(tokenQR),
        estudianteId: estudianteAutenticado,
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

  async obtenerListaConsolidada(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sesionId = Number(req.params.sesionId);
      if (!sesionId || Number.isNaN(sesionId)) throw new AppError('El parámetro sesionId es obligatorio y debe ser numérico.', 400);
      const lista = await asistenciaService.obtenerListaConsolidada(sesionId);
      res.status(200).json({ status: 'success', data: lista });
    } catch (error) {
      next(error);
    }
  }

  async actualizar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const docenteId = req.user?.id ? Number(req.user.id) : 0;
      const sesionId = Number(req.params.sesionId);
      const estudianteId = Number(req.params.estudianteId);
      const resultado = await asistenciaService.actualizarAsistencia({
        sesionId,
        estudianteId,
        docenteId,
        estado: String(req.body.estado) as EstadoAsistencia,
        justificativo: req.body.justificativo ? String(req.body.justificativo) : undefined,
        equipoId: req.body.equipoId !== undefined ? Number(req.body.equipoId) : undefined,
      });
      res.status(200).json({ status: 'success', data: { asistencia: resultado } });
    } catch (error) {
      next(error);
    }
  }

  async confirmar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sesionId = Number(req.params.sesionId);
      const docenteId = req.user?.id ? Number(req.user.id) : 0;
      const resultado = await asistenciaService.confirmarAsistencia(sesionId, docenteId);
      res.status(200).json({ status: 'success', data: resultado });
    } catch (error) {
      next(error);
    }
  }
}

export const asistenciaController = new AsistenciaController();
