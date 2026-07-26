// backend/src/services/planEstudio.service.ts
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/appError.js';

export class PlanEstudioService {
  async crear(data: { carreraId: number; gestion: number; descripcion?: string }) {
    // 1. Verificar que la carrera exista y esté activa
    const carrera = await prisma.carrera.findUnique({
      where: { id: data.carreraId },
    });

    if (!carrera || !carrera.activo) {
      throw new AppError('La carrera especificada no existe o se encuentra inactiva.', 404);
    }

    // 2. Crear el plan de estudio
    return await prisma.planEstudio.create({
      data: {
        carreraId: data.carreraId,
        gestion: data.gestion,
        descripcion: data.descripcion,
      },
      include: {
        carrera: { select: { id: true, nombre: true } },
      },
    });
  }

  async listarPorCarrera(carreraId: number) {
    return await prisma.planEstudio.findMany({
      where: { carreraId },
      include: {
        materias: { select: { id: true, codigo: true, nombre: true, semestre: true, tipoPeriodo: true } },
      },
      orderBy: { gestion: 'desc' },
    });
  }

  async obtenerPorId(id: number) {
    const plan = await prisma.planEstudio.findUnique({
      where: { id },
      include: {
        carrera: true,
        materias: true,
      },
    });

    if (!plan) {
      throw new AppError('El plan de estudio solicitado no existe.', 404);
    }

    return plan;
  }

  async actualizar(id: number, data: { gestion?: number; descripcion?: string; activo?: boolean }) {
    await this.obtenerPorId(id); // Lanza error si no existe

    return await prisma.planEstudio.update({
      where: { id },
      data,
    });
  }

  async eliminar(id: number) {
    await this.obtenerPorId(id);

    // Opcional: Validar si tiene materias asociadas antes de eliminar o permitir restricción de base de datos
    return await prisma.planEstudio.delete({
      where: { id },
    });
  }
}

export const planEstudioService = new PlanEstudioService();