import { prisma } from '../config/prisma.js';
import { Prisma } from '@prisma/client';
import { CreateActivityDTO, UpdateActivityDTO } from '../interfaces/activity.interface.js';

export class ActivityRepository {
  async findAll(careerScope?: string) {
    return prisma.activity.findMany({
      where: careerScope ? { careerScope } : undefined,
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

  async delete(id: string) {
    return prisma.activity.delete({ where: { id } });
  }
}
