import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/appError.js';
import { CrearEquipoDTO, ActualizarEquipoDTO, FiltrosEquipoDTO } from '../interfaces/equipo.interface.js';

export class EquipoService {
  async listar(filtros: FiltrosEquipoDTO) {
    const whereClause: Record<string, unknown> = {};

    if (filtros.laboratorioId) whereClause.laboratorioId = filtros.laboratorioId;
    if (filtros.categoria) whereClause.categoria = filtros.categoria;
    if (filtros.estado) whereClause.estado = filtros.estado;

    if (filtros.busqueda && filtros.busqueda.trim() !== '') {
      whereClause.OR = [
        { nombre: { contains: filtros.busqueda.trim(), mode: 'insensitive' } },
        { codigoPatrimonial: { contains: filtros.busqueda.trim(), mode: 'insensitive' } },
        { marca: { contains: filtros.busqueda.trim(), mode: 'insensitive' } },
        { modelo: { contains: filtros.busqueda.trim(), mode: 'insensitive' } },
        { numeroSerie: { contains: filtros.busqueda.trim(), mode: 'insensitive' } },
      ];
    }

    const items = await prisma.equipo.findMany({
      where: whereClause,
      include: {
        laboratorio: { select: { id: true, nombre: true } },
        _count: { select: { incidencias: true } },
      },
      orderBy: { id: 'desc' },
    });

    const conteos = {
      total: items.length,
      operativos: items.filter((i) => i.estado === 'OPERATIVO').length,
      enMantenimiento: items.filter((i) => i.estado === 'EN_MANTENIMIENTO').length,
      deteriorados: items.filter((i) => i.estado === 'DETERIORADO').length,
      deBaja: items.filter((i) => i.estado === 'DE_BAJA').length,
    };

    return { items, conteos };
  }

  async obtenerPorId(id: number) {
    const equipo = await prisma.equipo.findUnique({
      where: { id },
      include: {
        laboratorio: { select: { id: true, nombre: true } },
        incidencias: { orderBy: { fechaReporte: 'desc' }, take: 5 },
      },
    });
    if (!equipo) throw new AppError('El activo o equipo no existe.', 404);
    return equipo;
  }

  async crear(data: CrearEquipoDTO) {
    const lab = await prisma.laboratorio.findUnique({ where: { id: data.laboratorioId } });
    if (!lab) throw new AppError('El laboratorio especificado no existe.', 404);

    if (data.codigoPatrimonial && data.codigoPatrimonial.trim() !== '') {
      const existeCodigo = await prisma.equipo.findUnique({
        where: { codigoPatrimonial: data.codigoPatrimonial.trim() },
      });
      if (existeCodigo) throw new AppError(`El código patrimonial "${data.codigoPatrimonial}" ya está asignado.`, 400);
    }

    return prisma.equipo.create({
      data: {
        laboratorioId: data.laboratorioId,
        codigoPatrimonial: data.codigoPatrimonial ? data.codigoPatrimonial.trim() : null,
        nombre: data.nombre.trim(),
        categoria: data.categoria || 'COMPUTO',
        estado: data.estado || 'OPERATIVO',
        marca: data.marca ? data.marca.trim() : null,
        modelo: data.modelo ? data.modelo.trim() : null,
        numeroSerie: data.numeroSerie ? data.numeroSerie.trim() : null,
        ubicacionDetalle: data.ubicacionDetalle ? data.ubicacionDetalle.trim() : null,
        descripcion: data.descripcion ? data.descripcion.trim() : null,
      },
      include: { laboratorio: { select: { id: true, nombre: true } } },
    });
  }

  async actualizar(id: number, data: ActualizarEquipoDTO) {
    const existente = await prisma.equipo.findUnique({ where: { id } });
    if (!existente) throw new AppError('El activo a actualizar no existe.', 404);

    if (data.codigoPatrimonial && data.codigoPatrimonial.trim() !== existente.codigoPatrimonial) {
      const existeCodigo = await prisma.equipo.findUnique({
        where: { codigoPatrimonial: data.codigoPatrimonial.trim() },
      });
      if (existeCodigo) throw new AppError(`El código patrimonial "${data.codigoPatrimonial}" ya existe.`, 400);
    }

    return prisma.equipo.update({
      where: { id },
      data: {
        laboratorioId: data.laboratorioId ?? undefined,
        codigoPatrimonial: data.codigoPatrimonial !== undefined ? (data.codigoPatrimonial ? data.codigoPatrimonial.trim() : null) : undefined,
        nombre: data.nombre ? data.nombre.trim() : undefined,
        categoria: data.categoria ?? undefined,
        estado: data.estado ?? undefined,
        marca: data.marca !== undefined ? (data.marca ? data.marca.trim() : null) : undefined,
        modelo: data.modelo !== undefined ? (data.modelo ? data.modelo.trim() : null) : undefined,
        numeroSerie: data.numeroSerie !== undefined ? (data.numeroSerie ? data.numeroSerie.trim() : null) : undefined,
        ubicacionDetalle: data.ubicacionDetalle !== undefined ? (data.ubicacionDetalle ? data.ubicacionDetalle.trim() : null) : undefined,
        descripcion: data.descripcion !== undefined ? (data.descripcion ? data.descripcion.trim() : null) : undefined,
      },
      include: { laboratorio: { select: { id: true, nombre: true } } },
    });
  }

  async eliminar(id: number) {
    const existente = await prisma.equipo.findUnique({
      where: { id },
      include: { _count: { select: { incidencias: true } } },
    });
    if (!existente) throw new AppError('El activo a eliminar no existe.', 404);

    if (existente._count.incidencias > 0) {
      throw new AppError('No se puede eliminar el activo porque tiene incidencias registradas. Puede cambiar su estado a "DE_BAJA".', 400);
    }

    await prisma.equipo.delete({ where: { id } });
    return { id };
  }
}

export const equipoService = new EquipoService();
