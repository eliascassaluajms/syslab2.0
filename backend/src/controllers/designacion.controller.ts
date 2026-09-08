import { Request, Response, NextFunction } from 'express';
import { DesignacionService } from '../services/designacion.service.js';

export class DesignacionController {
  static async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const designacion = await DesignacionService.crearOActualizar(req.body);
      return res.status(201).json({
        success: true,
        message: 'Designación de materia registrada exitosamente.',
        data: designacion
      });
    } catch (error) {
      next(error);
    }
  }

  static async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const gestion = req.query.gestion ? Number(req.query.gestion) : new Date().getFullYear();
      const designaciones = await DesignacionService.listarPorGestion(gestion);
      return res.status(200).json({
        success: true,
        data: designaciones
      });
    } catch (error) {
      next(error);
    }
  }

  static async eliminar(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      await DesignacionService.eliminar(id);
      return res.status(200).json({
        success: true,
        message: 'Designación eliminada correctamente del sistema.'
      });
    } catch (error) {
      next(error);
    }
  }
}
