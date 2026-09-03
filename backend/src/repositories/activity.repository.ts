import { prisma } from '../config/prisma.js';
import { Prisma } from '@prisma/client';
import { CreateActivityDTO, UpdateActivityDTO } from '../interfaces/activity.interface.js';

export class ActivityRepository {
  async findAll(careerScope?: string, soloActivos: boolean = false) {
    const where: Prisma.ActivityWhereInput = {};
    if (careerScope) {
      where.careerScope = careerScope;
    }
    if (soloActivos) {
      where.activo = true;
    }

    return prisma.activity.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: { lab: true },
    });
  }

  async findById(id: string) {
    return prisma.activity.findUnique({ where: { id }, include: { lab: true } });
  }

  async create(data: CreateActivityDTO) {
    return prisma.activity.create({ data, include: { lab: true } });
  }

  async update(id: string, data: UpdateActivityDTO) {
    return prisma.activity.update({ where: { id }, data, include: { lab: true } });
  }

  async cambiarEstado(id: string, activo: boolean) {
    return prisma.activity.update({ where: { id }, data: { activo }, include: { lab: true } });
  }

  async delete(id: string) {
    return prisma.activity.delete({ where: { id } });
  }
}
