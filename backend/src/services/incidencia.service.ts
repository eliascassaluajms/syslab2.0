import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/appError.js';
import {
  CrearIncidenciaDTO,
  GestionarIncidenciaDTO,
  FiltrosIncidenciaDTO,
} from '../interfaces/incidencia.interface.js';

export class IncidenciaService {
  async listar(filtros: FiltrosIncidenciaDTO) {
    const whereClause: Record<string, unknown> = {};

    if (filtros.solicitanteId) whereClause.solicitanteId = filtros.solicitanteId;
    if (filtros.estado) whereClause.estado = filtros.estado;
    if (filtros.laboratorioId) whereClause.laboratorioId = filtros.laboratorioId;
    if (filtros.prioridad) whereClause.prioridad = filtros.prioridad;

    const incidencias = await prisma.incidencia.findMany({
      where: whereClause,
      include: {
        laboratorio: { select: { id: true, nombre: true } },
        solicitante: { select: { id: true, nombre: true, apellido: true, correo: true } },
        tecnicoAsignado: { select: { id: true, nombre: true, apellido: true } },
        equipo: { select: { id: true, codigoPatrimonial: true, nombre: true } },
      },
      orderBy: { fechaReporte: 'desc' },
    });

    const conteos = {
      total: incidencias.length,
      pendientes: incidencias.filter((i) => i.estado === 'PENDIENTE').length,
      enProceso: incidencias.filter((i) => i.estado === 'EN_PROCESO').length,
      resueltas: incidencias.filter((i) => i.estado === 'RESUELTO').length,
    };

    return { incidencias, conteos };
  }

  async crear(data: CrearIncidenciaDTO) {
    const lab = await prisma.laboratorio.findUnique({ where: { id: data.laboratorioId } });
    if (!lab) throw new AppError('El laboratorio especificado no existe.', 404);

    return prisma.incidencia.create({
      data: {
        laboratorioId: data.laboratorioId,
        solicitanteId: data.solicitanteId,
        equipoId: data.equipoId ?? null,
        titulo: data.titulo.trim(),
        descripcion: data.descripcion.trim(),
        prioridad: data.prioridad ?? 'MEDIA',
        estado: 'PENDIENTE',
      },
      include: {
        laboratorio: { select: { id: true, nombre: true } },
      },
    });
  }

  async gestionar(id: number, data: GestionarIncidenciaDTO) {
    const incidencia = await prisma.incidencia.findUnique({ where: { id } });
    if (!incidencia) throw new AppError('La incidencia solicitada no existe.', 404);

    const updateData: Record<string, unknown> = {};
    if (data.estado) updateData.estado = data.estado;
    if (data.prioridad) updateData.prioridad = data.prioridad;
    if (data.tecnicoId !== undefined) updateData.tecnicoId = data.tecnicoId;
    if (data.solucion !== undefined) updateData.solucion = data.solucion;

    if (data.estado === 'RESUELTO' && !incidencia.fechaResolucion) {
      updateData.fechaResolucion = new Date();
    }

    return prisma.incidencia.update({
      where: { id },
      data: updateData,
    });
  }
}

export const incidenciaService = new IncidenciaService();
