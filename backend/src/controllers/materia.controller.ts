// backend/src/controllers/materia.controller.ts
import { Request, Response, NextFunction } from 'express';
import { materiaService } from '../services/materia.service.js';
import { AppError } from '../utils/appError.js';

export class MateriaController {
  async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { codigo, nombre, planId, tipoPeriodo, semestre } = req.body;

      if (!codigo || !nombre || !planId || !semestre) {
        throw new AppError('Faltan datos obligatorios (código, nombre, planId, semestre).', 400);
      }

      const nuevaMateria = await materiaService.crear({
        codigo,
        nombre,
        planId: Number(planId),
        tipoPeriodo,
        semestre: Number(semestre),
      });

      res.status(201).json({
        status: 'success',
        data: { materia: nuevaMateria },
      });
    } catch (error) {
      next(error);
    }
  }

  async listarPorPlan(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { planId } = req.params;
      const materias = await materiaService.listarPorPlan(Number(planId));

      res.status(200).json({
        status: 'success',
        results: materias.length,
        data: { materias },
      });
    } catch (error) {
      next(error);
    }
  }

  async listarTodas(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const materias = await materiaService.listarTodas();

      res.status(200).json({
        status: 'success',
        results: materias.length,
        data: { materias },
      });
    } catch (error) {
      next(error);
    }
  }

  async obtenerUno(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const materia = await materiaService.obtenerPorId(Number(id));

      res.status(200).json({
        status: 'success',
        data: { materia },
      });
    } catch (error) {
      next(error);
    }
  }

  async actualizar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { codigo, nombre, tipoPeriodo, semestre } = req.body;

      const materiaActualizada = await materiaService.actualizar(Number(id), {
        codigo,
        nombre,
        tipoPeriodo,
        semestre: semestre ? Number(semestre) : undefined,
      });

      res.status(200).json({
        status: 'success',
        data: { materia: materiaActualizada },
      });
    } catch (error) {
      next(error);
    }
  }

  async eliminar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await materiaService.eliminar(Number(id));

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const materiaController = new MateriaController();