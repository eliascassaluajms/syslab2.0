import { TipoUsoLaboratorio, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';

export interface IniciarSesionBitacoraInput {
  laboratorioId: number;
  materiaId?: number | null;
  docenteId?: number | null;
  nombreAyudante?: string | null;
  materiaNombre?: string | null;
  tipoUso?: TipoUsoLaboratorio;
  grupo?: number;
  semestre?: number;
  gestion?: number;
  fecha: Date;
  horaInicio: string;
  tokenQR: string;
  practicaRealizada?: string | null;
}

export interface FinalizarSesionBitacoraInput {
  horaFin: string;
  practicaRealizada?: string | null;
  cumplio: boolean;
}

export class BitacoraRepository {
  async obtenerSesionActiva(laboratorioId: number, fechaInicioDia: Date, fechaFinDia: Date) {
    return prisma.sesionBitacora.findFirst({
      where: {
        laboratorioId,
        fecha: {
          gte: fechaInicioDia,
          lte: fechaFinDia,
        },
        cumplio: false,
      },
    });
  }

  async crear(data: IniciarSesionBitacoraInput) {
    return prisma.sesionBitacora.create({
      data: {
        laboratorioId: data.laboratorioId,
        materiaId: data.materiaId ?? null,
        docenteId: data.docenteId ?? null,
        nombreAyudante: data.nombreAyudante ?? null,
        materiaNombre: data.materiaNombre ?? null,
        tipoUso: data.tipoUso ?? 'REGULAR',
        grupo: data.grupo ?? 1,
        semestre: data.semestre ?? 1,
        gestion: data.gestion ?? new Date().getFullYear(),
        fecha: data.fecha,
        horaInicio: data.horaInicio,
        horaFin: '',
        practicaRealizada: data.practicaRealizada ?? null,
        cumplio: false,
        tokenQR: data.tokenQR,
      },
      include: {
        laboratorio: {
          select: { id: true, nombre: true, codigo: true, ubicacion: true },
        },
        materia: {
          select: { id: true, nombre: true, codigo: true },
        },
        docente: {
          select: { id: true, nombre: true, apellido: true, correo: true },
        },
        asistencias: {
          include: {
            estudiante: { select: { id: true, nombre: true, apellido: true, correo: true } },
            equipo: { select: { id: true, nombre: true, codigoPatrimonial: true } },
          },
          orderBy: { estudiante: { apellido: 'asc' } },
        },
      },
    });
  }

  async obtenerPorId(id: number) {
    return prisma.sesionBitacora.findUnique({
      where: { id },
      include: {
        laboratorio: {
          select: { id: true, nombre: true, codigo: true, ubicacion: true },
        },
        materia: {
          select: { id: true, nombre: true, codigo: true },
        },
        docente: {
          select: { id: true, nombre: true, apellido: true, correo: true },
        },
      },
    });
  }

  async obtenerPorToken(tokenQR: string) {
    return prisma.sesionBitacora.findUnique({
      where: { tokenQR },
      include: {
        laboratorio: {
          select: { id: true, nombre: true, codigo: true, ubicacion: true },
        },
        materia: {
          select: { id: true, nombre: true, codigo: true },
        },
        docente: {
          select: { id: true, nombre: true, apellido: true, correo: true },
        },
      },
    });
  }

  async finalizar(id: number, data: FinalizarSesionBitacoraInput) {
    return prisma.sesionBitacora.update({
      where: { id },
      data: {
        horaFin: data.horaFin,
        practicaRealizada: data.practicaRealizada ?? null,
        cumplio: data.cumplio,
      },
      include: {
        laboratorio: {
          select: { id: true, nombre: true, codigo: true, ubicacion: true },
        },
        materia: {
          select: { id: true, nombre: true, codigo: true },
        },
        docente: {
          select: { id: true, nombre: true, apellido: true, correo: true },
        },
      },
    });
  }

  async listar(filtros: { laboratorioId?: number; fecha?: string; cumplio?: boolean }) {
    const where: Prisma.SesionBitacoraWhereInput = {};

    if (filtros.laboratorioId) {
      where.laboratorioId = filtros.laboratorioId;
    }

    if (filtros.cumplio !== undefined) {
      where.cumplio = filtros.cumplio;
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

    return prisma.sesionBitacora.findMany({
      where,
      include: {
        laboratorio: { select: { id: true, nombre: true, codigo: true } },
        materia: { select: { id: true, nombre: true, codigo: true } },
        docente: { select: { id: true, nombre: true, apellido: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

export const bitacoraRepository = new BitacoraRepository();
