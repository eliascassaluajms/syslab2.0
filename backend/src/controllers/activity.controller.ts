import { Request, Response, NextFunction } from 'express';
import { ActivityService } from '../services/activity.service.js';

const service = new ActivityService();

export class ActivityController {
  static async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const careerScope = (req.user?.carreras ?? []).map((career) => String(career));
      const role = (req.user as any)?.role ?? req.user?.rol ?? '';

      const result = await service.getActivities(careerScope.join(','), role);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async crear(req: Request, res: Response, next: NextFunction) {
    try {
      // Extraer carrera seleccionada desde req.body (Administrador) o asignación por defecto
      const selectedCareer = req.body.carreraId || req.body.carrera_id;
      const userCarreras = req.user?.carreras || [];

      const careerScope = selectedCareer
        ? [String(selectedCareer)]
        : userCarreras.map((career) => String(career));

      const role = (req.user as any)?.role ?? (req.user as any)?.roles?.[0] ?? req.user?.rol ?? '';
      const usuarioId = req.user?.id;

      // Inyectar contexto formateado al payload
      const payload = {
        ...req.body,
        usuarioId: usuarioId || req.body.usuarioId,
        usuario_id: usuarioId || req.body.usuario_id,
        carreraId: selectedCareer ? Number(selectedCareer) : (userCarreras[0] || null),
        carrera_id: selectedCareer ? Number(selectedCareer) : (userCarreras[0] || null),
      };

      const result = await service.createActivity(payload, careerScope.join(','), role);
      res.status(201).json(result);
    } catch (error: any) {
      console.error('❌ [ActivityController.crear] Error:', error?.stack || error);
      next(error);
    }
  }
}
