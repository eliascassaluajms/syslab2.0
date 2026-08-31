import { prisma } from '../config/prisma.js';

export interface RegistrarAsistenciaInput {
  sesionBitacoraId: number;
  estudianteId: number;
  fechaHora?: Date;
}

export class AsistenciaRepository {
  async buscarAsistenciaExistente(sesionBitacoraId: number, estudianteId: number) {
    return prisma.asistenciaEstudiante.findFirst({
      where: {
        sesionBitacoraId,
        estudianteId,
      },
    });
  }

  async registrar(data: RegistrarAsistenciaInput) {
    return prisma.asistenciaEstudiante.create({
      data: {
        sesionBitacoraId: data.sesionBitacoraId,
        estudianteId: data.estudianteId,
        fechaHora: data.fechaHora ?? new Date(),
      },
      include: {
        estudiante: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            correo: true,
          },
        },
      },
    });
  }

  async listarPorSesion(sesionBitacoraId: number) {
    return prisma.asistenciaEstudiante.findMany({
      where: { sesionBitacoraId },
      include: {
        estudiante: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            correo: true,
          },
        },
      },
      orderBy: { fechaHora: 'asc' },
    });
  }
}

export const asistenciaRepository = new AsistenciaRepository();
