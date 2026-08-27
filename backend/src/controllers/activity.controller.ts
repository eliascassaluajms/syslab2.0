import { Request, Response, NextFunction } from 'express';
import { ActivityService } from '../services/activity.service';

const service = new ActivityService();

export class ActivityController {
  static async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.getActivities(req.user?.careerScope, req.user?.role);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await service.createActivity(req.body, req.user!.careerScope, req.user!.role);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
}
