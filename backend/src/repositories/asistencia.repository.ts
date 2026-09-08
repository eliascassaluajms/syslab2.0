import { EstadoAsistencia, OrigenMarcado } from '@prisma/client';
import { prisma } from '../config/prisma.js';

export interface RegistrarAsistenciaInput {
  sesionBitacoraId: number;
  estudianteId: number;
  fechaHora?: Date;
  equipoId?: number | null;
  estado?: EstadoAsistencia;
  origen?: OrigenMarcado;
  justificativo?: string | null;
  modificadoPorId?: number | null;
}

export class AsistenciaRepository {
  async buscarAsistenciaExistente(sesionBitacoraId: number, estudianteId: number) {
    return prisma.asistenciaEstudiante.findUnique({
      where: {
        sesionBitacoraId_estudianteId: {
          sesionBitacoraId,
          estudianteId,
        },
      },
    });
  }

  async registrar(data: RegistrarAsistenciaInput) {
    return prisma.asistenciaEstudiante.create({
      data: {
        sesionBitacoraId: data.sesionBitacoraId,
        estudianteId: data.estudianteId,
        equipoId: data.equipoId ?? null,
        fechaHora: data.fechaHora ?? new Date(),
        estado: data.estado ?? EstadoAsistencia.PRESENTE,
        origen: data.origen ?? OrigenMarcado.QR_ESTUDIANTE,
        justificativo: data.justificativo ?? null,
        modificadoPorId: data.modificadoPorId ?? null,
      },
      include: {
        estudiante: {
          select: {
            id: true,
            username: true,
            nombre: true,
            apellido: true,
            correo: true,
          },
        },
        equipo: {
          select: { id: true, nombre: true, codigoPatrimonial: true },
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
            username: true,
            nombre: true,
            apellido: true,
            correo: true,
          },
        },
        equipo: {
          select: { id: true, nombre: true, codigoPatrimonial: true },
        },
      },
      orderBy: { fechaHora: 'asc' },
    });
  }
}

export const asistenciaRepository = new AsistenciaRepository();
