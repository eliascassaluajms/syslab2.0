import { EstadoDesafio, EstadoUsoEquipo } from '@prisma/client';
import { prisma } from '../config/prisma.js';

export interface CrearDesafioInput {
  dispositivoId: number;
  equipoId: number;
  laboratorioId: number;
  codigo: string;
  expiraEn: Date;
}

export interface CrearUsoEquipoInput {
  equipoId: number;
  laboratorioId: number;
  estudianteId: number;
  sesionBitacoraId?: number | null;
  desafioId: number;
}

export class UnlockRepository {
  obtenerDispositivoPorToken(deviceToken: string) {
    return prisma.dispositivoEscritorio.findUnique({
      where: { deviceToken },
      include: {
        equipo: {
          select: { id: true, codigoPatrimonial: true, nombre: true, estado: true },
        },
        laboratorio: {
          select: { id: true, codigo: true, nombre: true },
        },
      },
    });
  }

  obtenerDispositivoPorEquipoId(equipoId: number) {
    return prisma.dispositivoEscritorio.findUnique({
      where: { equipoId },
      include: {
        equipo: {
          select: { id: true, codigoPatrimonial: true, nombre: true, estado: true },
        },
        laboratorio: {
          select: { id: true, codigo: true, nombre: true },
        },
      },
    });
  }

  crearDispositivo(data: {
    equipoId: number;
    laboratorioId: number;
    deviceToken: string;
    nombreEquipo?: string | null;
  }) {
    return prisma.dispositivoEscritorio.create({ data });
  }

  marcarConexion(id: number) {
    return prisma.dispositivoEscritorio.update({
      where: { id },
      data: { ultimaConexion: new Date() },
    });
  }

  cancelarDesafiosPendientes(equipoId: number) {
    return prisma.desafioDesbloqueo.updateMany({
      where: { equipoId, estado: EstadoDesafio.ESPERANDO },
      data: { estado: EstadoDesafio.CANCELADO },
    });
  }

  crearDesafio(data: CrearDesafioInput) {
    return prisma.desafioDesbloqueo.create({ data });
  }

  obtenerDesafioPorId(id: number) {
    return prisma.desafioDesbloqueo.findUnique({
      where: { id },
      include: {
        equipo: {
          select: { id: true, codigoPatrimonial: true, nombre: true },
        },
        laboratorio: {
          select: { id: true, codigo: true, nombre: true },
        },
      },
    });
  }

  buscarDesafiosPendientesPorCodigo(codigo: string, ahora: Date, laboratorioId?: number) {
    return prisma.desafioDesbloqueo.findMany({
      where: {
        codigo,
        estado: EstadoDesafio.ESPERANDO,
        expiraEn: { gt: ahora },
        ...(laboratorioId ? { laboratorioId } : {}),
      },
      include: {
        equipo: {
          select: { id: true, codigoPatrimonial: true, nombre: true },
        },
        laboratorio: {
          select: { id: true, codigo: true, nombre: true },
        },
      },
      orderBy: { creadoEn: 'desc' },
    });
  }

  marcarLiberado(id: number, usuarioId: number) {
    return prisma.desafioDesbloqueo.update({
      where: { id },
      data: { estado: EstadoDesafio.LIBERADO, liberadoPorId: usuarioId, liberadoEn: new Date() },
    });
  }

  marcarExpirado(id: number) {
    return prisma.desafioDesbloqueo.update({
      where: { id },
      data: { estado: EstadoDesafio.EXPIRADO },
    });
  }

  obtenerSesionActivaEnLaboratorio(laboratorioId: number, fechaInicioDia: Date, fechaFinDia: Date) {
    return prisma.sesionBitacora.findFirst({
      where: {
        laboratorioId,
        fecha: { gte: fechaInicioDia, lte: fechaFinDia },
        cumplio: false,
      },
      include: {
        materia: { select: { id: true, nombre: true } },
      },
    });
  }

  cerrarUsosActivosDeEquipo(equipoId: number, fecha: Date) {
    return prisma.usoEquipo.updateMany({
      where: { equipoId, estado: EstadoUsoEquipo.ACTIVO },
      data: { estado: EstadoUsoEquipo.CERRADO, fechaHoraFin: fecha },
    });
  }

  crearUsoEquipo(data: CrearUsoEquipoInput) {
    return prisma.usoEquipo.create({ data });
  }

  existeCodigoPendiente(codigo: string, laboratorioId: number, ahora: Date) {
    return prisma.desafioDesbloqueo.findFirst({
      where: {
        codigo,
        laboratorioId,
        estado: EstadoDesafio.ESPERANDO,
        expiraEn: { gt: ahora },
      },
      select: { id: true },
    });
  }
}

export const unlockRepository = new UnlockRepository();