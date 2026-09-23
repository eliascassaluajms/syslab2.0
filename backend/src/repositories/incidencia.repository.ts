import { EstadoIncidencia, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import type { AgregarNotaDTO, CrearIncidenciaDTO, FiltrosIncidenciaDTO, GestionarIncidenciaDTO } from '../interfaces/incidencia.interface.js';

const SELECT_INCLUIDO = {
  laboratorio: { select: { id: true, nombre: true } },
  solicitante: { select: { id: true, nombre: true, apellido: true, correo: true } },
  tecnicoAsignado: { select: { id: true, nombre: true, apellido: true } },
  equipo: { select: { id: true, codigoPatrimonial: true, nombre: true } },
} satisfies Prisma.IncidenciaInclude;

const SELECT_NOTAS = {
  notas: {
    select: {
      id: true,
      mensaje: true,
      esSistema: true,
      fecha: true,
      autor: { select: { id: true, nombre: true, apellido: true } },
    },
    orderBy: { fecha: 'asc' as const },
  },
};

export class IncidenciaRepository {
  listar(filtros: FiltrosIncidenciaDTO) {
    const whereClause: Prisma.IncidenciaWhereInput = {};
    if (filtros.solicitanteId) whereClause.solicitanteId = filtros.solicitanteId;
    if (filtros.estado) whereClause.estado = filtros.estado;
    if (filtros.laboratorioId) whereClause.laboratorioId = filtros.laboratorioId;
    if (filtros.prioridad) whereClause.prioridad = filtros.prioridad;
    if (filtros.tipo) whereClause.tipo = filtros.tipo;
    if (filtros.equipoId) whereClause.equipoId = filtros.equipoId;

    return prisma.incidencia.findMany({
      where: whereClause,
      include: SELECT_INCLUIDO,
      orderBy: { fechaReporte: 'desc' },
    });
  }

  listarMisReportes(solicitanteId: number, estado?: EstadoIncidencia) {
    const whereClause: Prisma.IncidenciaWhereInput = {
      solicitanteId,
      ...(estado ? { estado } : {}),
    };

    return prisma.incidencia.findMany({
      where: whereClause,
      include: SELECT_INCLUIDO,
      orderBy: { fechaReporte: 'desc' },
    });
  }

  obtenerPorId(id: number) {
    return prisma.incidencia.findUnique({
      where: { id },
      include: {
        ...SELECT_INCLUIDO,
        ...SELECT_NOTAS,
      },
    });
  }

  obtenerPorFolio(folio: string) {
    return prisma.incidencia.findUnique({
      where: { folio },
    });
  }

  obtenerPorClienteUuid(solicitanteId: number, clienteUuid: string) {
    return prisma.incidencia.findUnique({
      where: {
        solicitanteId_clienteUuid: { solicitanteId, clienteUuid },
      },
      include: {
        ...SELECT_INCLUIDO,
        ...SELECT_NOTAS,
      },
    });
  }

  crear(data: CrearIncidenciaDTO & { folio: string }) {
    return prisma.incidencia.create({
      data: {
        laboratorioId: data.laboratorioId,
        solicitanteId: data.solicitanteId,
        clienteUuid: data.clienteUuid ?? null,
        equipoId: data.equipoId ?? null,
        folio: data.folio,
        titulo: data.titulo.trim(),
        descripcion: data.descripcion.trim(),
        tipo: data.tipo ?? 'HARDWARE',
        categoriaEquipo: data.categoriaEquipo ?? 'PC',
        prioridad: data.prioridad ?? 'MEDIA',
        estado: 'PENDIENTE',
      },
      include: {
        laboratorio: { select: { id: true, nombre: true } },
      },
    });
  }

  actualizar(id: number, data: GestionarIncidenciaDTO & { fechaResolucion?: Date }) {
    const updateData: Prisma.IncidenciaUpdateInput = {};
    if (data.estado) updateData.estado = data.estado;
    if (data.prioridad) updateData.prioridad = data.prioridad;
    if (data.tipo) updateData.tipo = data.tipo;
    if (data.categoriaEquipo) updateData.categoriaEquipo = data.categoriaEquipo;
    if (data.tecnicoId !== undefined) {
      updateData.tecnicoAsignado = data.tecnicoId
        ? { connect: { id: data.tecnicoId } }
        : { disconnect: true };
    }
    if (data.solucion !== undefined) updateData.solucion = data.solucion;
    if (data.fechaResolucion) updateData.fechaResolucion = data.fechaResolucion;

    return prisma.incidencia.update({
      where: { id },
      data: updateData,
      include: SELECT_INCLUIDO,
    });
  }

  crearNota(data: AgregarNotaDTO) {
    return prisma.incidenciaNota.create({
      data: {
        incidenciaId: data.incidenciaId,
        autorId: data.autorId,
        mensaje: data.mensaje.trim(),
      },
      include: {
        autor: { select: { id: true, nombre: true, apellido: true } },
      },
    });
  }

  agregarNotaSistema(incidenciaId: number, mensaje: string) {
    return prisma.incidenciaNota.create({
      data: {
        incidenciaId,
        autorId: null,
        mensaje: mensaje.trim(),
        esSistema: true,
      },
    });
  }
}

export const incidenciaRepository = new IncidenciaRepository();