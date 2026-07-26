// backend/src/controllers/planEstudio.controller.ts
import { Request, Response, NextFunction } from 'express';
import { planEstudioService } from '../services/planEstudio.service.js';
import { AppError } from '../utils/appError.js';

export class PlanEstudioController {
  async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { carreraId, gestion, descripcion } = req.body;

      if (!carreraId || !gestion) {
        throw new AppError('Debe proporcionar la carrera y la gestión para el plan de estudio.', 400);
      }

      const nuevoPlan = await planEstudioService.crear({
        carreraId: Number(carreraId),
        gestion: Number(gestion),
        descripcion,
      });

      res.status(201).json({
        status: 'success',
        data: { planEstudio: nuevoPlan },
      });
    } catch (error) {
      next(error);
    }
  }

  async listarPorCarrera(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { carreraId } = req.params;
      const planes = await planEstudioService.listarPorCarrera(Number(carreraId));

      res.status(200).json({
        status: 'success',
        results: planes.length,
        data: { planesEstudio: planes },
      });
    } catch (error) {
      next(error);
    }
  }

  async obtenerUno(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const plan = await planEstudioService.obtenerPorId(Number(id));

      res.status(200).json({
        status: 'success',
        data: { planEstudio: plan },
      });
    } catch (error) {
      next(error);
    }
  }

  async actualizar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { gestion, descripcion, activo } = req.body;

      const planActualizado = await planEstudioService.actualizar(Number(id), {
        gestion: gestion ? Number(gestion) : undefined,
        descripcion,
        activo,
      });

      res.status(200).json({
        status: 'success',
        data: { planEstudio: planActualizado },
      });
    } catch (error) {
      next(error);
    }
  }

  async eliminar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await planEstudioService.eliminar(Number(id));

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const planEstudioController = new PlanEstudioController();
