// backend/src/services/materia.service.ts
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/appError.js';

export class MateriaService {
  async crear(data: { codigo: string; nombre: string; planId: number; tipoPeriodo?: string; semestre: number }) {
    // 1. Verificar que el plan de estudio exista
    const plan = await prisma.planEstudio.findUnique({
      where: { id: data.planId },
    });

    if (!plan || !plan.activo) {
      throw new AppError('El plan de estudio especificado no existe o se encuentra inactivo.', 404);
    }

    // 2. Verificar que el código de la materia no esté registrado previamente
    const materiaExistente = await prisma.materia.findUnique({
      where: { codigo: data.codigo },
    });

    if (materiaExistente) {
      throw new AppError(`Ya existe una materia registrada con el código ${data.codigo}.`, 400);
    }

    // 3. Crear la materia
    return await prisma.materia.create({
      data: {
        codigo: data.codigo,
        nombre: data.nombre,
        planId: data.planId,
        tipoPeriodo: data.tipoPeriodo || 'Semestral',
        semestre: data.semestre,
      },
      include: {
        planEstudio: { select: { id: true, descripcion: true, gestion: true } },
      },
    });
  }

  async listarPorPlan(planId: number) {
    return await prisma.materia.findMany({
      where: { planId },
      orderBy: [{ semestre: 'asc' }, { nombre: 'asc' }],
    });
  }

  async obtenerPorId(id: number) {
    const materia = await prisma.materia.findUnique({
      where: { id },
      include: {
        planEstudio: {
          include: { carrera: { select: { id: true, nombre: true } } },
        },
      },
    });

    if (!materia) {
      throw new AppError('La materia solicitada no existe.', 404);
    }

    return materia;
  }

  async actualizar(id: number, data: { codigo?: string; nombre?: string; tipoPeriodo?: string; semestre?: number }) {
    await this.obtenerPorId(id); // Lanza error si no existe

    if (data.codigo) {
      const codigoOcupado = await prisma.materia.findFirst({
        where: { codigo: data.codigo, NOT: { id } },
      });
      if (codigoOcupado) {
        throw new AppError(`El código ${data.codigo} ya está asignado a otra materia.`, 400);
      }
    }

    return await prisma.materia.update({
      where: { id },
      data,
    });
  }

  async eliminar(id: number) {
    await this.obtenerPorId(id);

    return await prisma.materia.delete({
      where: { id },
    });
  }
}

export const materiaService = new MateriaService();