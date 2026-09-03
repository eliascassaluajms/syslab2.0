import { ActivityRepository } from '../repositories/activity.repository.js';
import { CreateActivityDTO, UpdateActivityDTO } from '../interfaces/activity.interface.js';
import { AppError } from '../utils/appError.js';

export class ActivityService {
  private activityRepo = new ActivityRepository();

  async getActivities(userCareerScope?: string, userRole?: string, soloActivos: boolean = false) {
    const scope = userRole === 'ADMIN_GLOBAL' ? undefined : userCareerScope;
    return this.activityRepo.findAll(scope, soloActivos);
  }

  async listar(soloActivos: boolean = false) {
    return this.activityRepo.findAll(undefined, soloActivos);
  }

  async createActivity(data: CreateActivityDTO, userCareerScope: string, userRole: string) {
    if (userRole !== 'ADMIN_GLOBAL' && data.careerScope !== userCareerScope) {
      throw new AppError('No tienes autorización para crear actividades fuera de tu ámbito de carrera', 403);
    }
    return this.activityRepo.create(data);
  }

  async updateActivity(id: string, data: UpdateActivityDTO) {
    const existing = await this.activityRepo.findById(id);
    if (!existing) throw new AppError('Actividad no encontrada', 404);
    return this.activityRepo.update(id, data);
  }

  async cambiarEstado(id: string, activo: boolean) {
    const existing = await this.activityRepo.findById(id);
    if (!existing) throw new AppError('Actividad no encontrada', 404);
    return this.activityRepo.cambiarEstado(id, activo);
  }

  async deleteActivity(id: string) {
    const existing = await this.activityRepo.findById(id);
    if (!existing) throw new AppError('Actividad no encontrada', 404);
    return this.activityRepo.delete(id);
  }
}
