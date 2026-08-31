import { Prisma } from '@prisma/client';
import { EstadoSolicitud } from '../services/solicitudExtraordinaria.service.js';
import { prisma } from '../config/prisma.js';

export interface CrearSolicitudExtraordinariaInput {
  laboratorioId: number;
  docenteId?: number | null;
  solicitadoPorDirector?: boolean;
  nombreAyudante?: string | null;
  materia: string;
  fecha: Date;
  horaInicio: string;
  horaFin: string;
  motivo: string;
  estado?: EstadoSolicitud;
}

export interface ListarSolicitudesFiltros {
  estado?: EstadoSolicitud;
  laboratorioId?: number;
  fecha?: string;
}

export class SolicitudExtraordinariaRepository {
  async crear(data: CrearSolicitudExtraordinariaInput) {
    return prisma.solicitudHorarioExtraordinario.create({
      data: {
        laboratorioId: data.laboratorioId,
        docenteId: data.docenteId ?? null,
        solicitadoPorDirector: data.solicitadoPorDirector ?? false,
        nombreAyudante: data.nombreAyudante ?? null,
        materia: data.materia,
        fecha: data.fecha,
        horaInicio: data.horaInicio,
        horaFin: data.horaFin,
        motivo: data.motivo,
        estado: data.estado ?? 'PENDIENTE',
      },
      include: {
        laboratorio: {
          select: { id: true, nombre: true, codigo: true, ubicacion: true },
        },
        docente: {
          select: { id: true, nombre: true, apellido: true, correo: true },
        },
      },
    });
  }

  async obtenerPorId(id: number) {
    return prisma.solicitudHorarioExtraordinario.findUnique({
      where: { id },
      include: {
        laboratorio: {
          select: { id: true, nombre: true, codigo: true, ubicacion: true },
        },
        docente: {
          select: { id: true, nombre: true, apellido: true, correo: true },
        },
      },
    });
  }

  async listar(filtros: ListarSolicitudesFiltros) {
    const where: Prisma.SolicitudHorarioExtraordinarioWhereInput = {};

    if (filtros.estado) {
      where.estado = filtros.estado;
    }

    if (filtros.laboratorioId) {
      where.laboratorioId = filtros.laboratorioId;
    }

    if (filtros.fecha) {
      const parts = filtros.fecha.split('-');
      if (parts.length === 3) {
        const year = Number(parts[0]);
        const month = Number(parts[1]);
        const day = Number(parts[2]);
        const fechaInicioDia = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
        const fechaFinDia = new Date(Date.UTC(year, month - 1, day, 23, 59, 59));
        where.fecha = {
          gte: fechaInicioDia,
          lte: fechaFinDia,
        };
      }
    }

    return prisma.solicitudHorarioExtraordinario.findMany({
      where,
      include: {
        laboratorio: {
          select: { id: true, nombre: true, codigo: true, ubicacion: true },
        },
        docente: {
          select: { id: true, nombre: true, apellido: true, correo: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async actualizarEstado(id: number, estado: EstadoSolicitud) {
    return prisma.solicitudHorarioExtraordinario.update({
      where: { id },
      data: { estado },
      include: {
        laboratorio: {
          select: { id: true, nombre: true, codigo: true, ubicacion: true },
        },
        docente: {
          select: { id: true, nombre: true, apellido: true, correo: true },
        },
      },
    });
  }
}

export const solicitudExtraordinariaRepository = new SolicitudExtraordinariaRepository();
