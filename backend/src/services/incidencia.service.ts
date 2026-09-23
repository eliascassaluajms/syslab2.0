import { EstadoIncidencia, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { incidenciaRepository } from '../repositories/incidencia.repository.js';
import { AppError } from '../utils/appError.js';
import {
  ESTADOS_VALIDOS,
  TRANSICIONES_PERMITIDAS,
} from '../utils/incidencia.estados.js';
import type {
  AgregarNotaDTO,
  CrearIncidenciaDTO,
  FiltrosIncidenciaDTO,
  GestionarIncidenciaDTO,
} from '../interfaces/incidencia.interface.js';

const ETIQUETA_ESTADO: Record<string, string> = {
  PENDIENTE: 'Ticket recibido',
  EN_REVISION: 'En revisión por el equipo técnico',
  EN_PROCESO: 'En proceso de diagnóstico y reparación',
  RESUELTO: 'Resuelto y verificado',
  DESCARTADO: 'Descartado',
};

export class IncidenciaService {
  private async generarFolio(): Promise<string> {
    const anio = new Date().getFullYear();
    const prefijo = `INC-${anio}-`;
    const ultima = await prisma.incidencia.findFirst({
      where: { folio: { startsWith: prefijo } },
      orderBy: { folio: 'desc' },
      select: { folio: true },
    });

    const siguiente = ultima
      ? Number(ultima.folio.slice(prefijo.length)) + 1
      : 1;
    return `${prefijo}${String(siguiente).padStart(4, '0')}`;
  }

  async listar(filtros: FiltrosIncidenciaDTO) {
    const incidencias = await incidenciaRepository.listar(filtros);

    const conteos = {
      total: incidencias.length,
      pendientes: incidencias.filter((i) => i.estado === 'PENDIENTE').length,
      enProceso: incidencias.filter((i) => i.estado === 'EN_PROCESO').length,
      resueltas: incidencias.filter((i) => i.estado === 'RESUELTO').length,
    };

    return { incidencias, conteos };
  }

  async listarMisReportes(solicitanteId: number, estado?: EstadoIncidencia) {
    const incidencias = await incidenciaRepository.listarMisReportes(solicitanteId, estado);
    const conteos = {
      total: incidencias.length,
      pendientes: incidencias.filter((i) => i.estado === 'PENDIENTE' || i.estado === 'EN_REVISION').length,
      enProceso: incidencias.filter((i) => i.estado === 'EN_PROCESO').length,
      resueltas: incidencias.filter((i) => i.estado === 'RESUELTO').length,
      descartadas: incidencias.filter((i) => i.estado === 'DESCARTADO').length,
    };
    return { incidencias, conteos };
  }

  async crear(data: CrearIncidenciaDTO) {
    const laboratorioId = Number(data.laboratorioId);
    if (!laboratorioId || Number.isNaN(laboratorioId)) {
      throw new AppError('El laboratorio es obligatorio.', 400);
    }

    const laboratorio = await prisma.laboratorio.findUnique({ where: { id: laboratorioId } });
    if (!laboratorio) {
      throw new AppError('El laboratorio especificado no existe.', 404);
    }

    const clienteUuid = data.clienteUuid?.trim();
    if (clienteUuid) {
      const existente = await incidenciaRepository.obtenerPorClienteUuid(data.solicitanteId, clienteUuid);
      if (existente) {
        return { incidencia: existente, duplicada: true };
      }
    }

    let equipoId: number | null = data.equipoId ? Number(data.equipoId) : null;
    if (equipoId) {
      const equipo = await prisma.equipo.findUnique({ where: { id: equipoId } });
      if (!equipo || equipo.laboratorioId !== laboratorioId) {
        throw new AppError('El equipo indicado no existe o no pertenece al laboratorio seleccionado.', 404);
      }
    }

    if (!data.titulo?.trim() || !data.descripcion?.trim()) {
      throw new AppError('El título y la descripción son obligatorios.', 400);
    }

    const folio = await this.generarFolio();
    let incidencia: Awaited<ReturnType<typeof incidenciaRepository.crear>>;

    try {
      incidencia = await incidenciaRepository.crear({ ...data, clienteUuid: clienteUuid || undefined, equipoId, folio });
    } catch (error) {
      if (clienteUuid && error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const existente = await incidenciaRepository.obtenerPorClienteUuid(data.solicitanteId, clienteUuid);
        if (existente) {
          return { incidencia: existente, duplicada: true };
        }
      }
      throw error;
    }

    await incidenciaRepository.agregarNotaSistema(incidencia.id, 'Ticket recibido. Pendiente de asignación.');

    return { incidencia: await this.obtenerPorId(incidencia.id, data.solicitanteId, true), duplicada: false };
  }

  async obtenerPorId(id: number, solicitanteId?: number, esGlobal = false) {
    const incidencia = await incidenciaRepository.obtenerPorId(id);
    if (!incidencia) {
      throw new AppError('La incidencia solicitada no existe.', 404);
    }

    const puedeVer = esGlobal ? true : incidencia.solicitanteId === solicitanteId;

    if (!puedeVer) {
      throw new AppError('No tiene permiso para ver esta incidencia.', 403);
    }

    return incidencia;
  }

  async gestionar(id: number, data: GestionarIncidenciaDTO) {
    const incidencia = await incidenciaRepository.obtenerPorId(id);
    if (!incidencia) {
      throw new AppError('La incidencia solicitada no existe.', 404);
    }

    const updateData: GestionarIncidenciaDTO & { fechaResolucion?: Date } = { ...data };

    if (data.estado) {
      if (!ESTADOS_VALIDOS.includes(data.estado as EstadoIncidencia)) {
        throw new AppError('Estado de incidencia no válido.', 400);
      }

      const permitidos = TRANSICIONES_PERMITIDAS[incidencia.estado as EstadoIncidencia];
      if (data.estado !== incidencia.estado && !permitidos.includes(data.estado)) {
        throw new AppError(
          `No se puede pasar de "${incidencia.estado}" a "${data.estado}". Estados permitidos: ${permitidos.join(', ')}.`,
          400,
        );
      }

      if (data.estado === 'RESUELTO' && !data.solucion?.trim()) {
        throw new AppError('Debe registrar la solución aplicada para marcar la incidencia como resuelta.', 400);
      }

      if (data.estado === 'RESUELTO' && !incidencia.fechaResolucion) {
        updateData.fechaResolucion = new Date();
      }
    }

    const incidenciaActualizada = await incidenciaRepository.actualizar(id, updateData);

    const cambios: string[] = [];
    if (data.estado && data.estado !== incidencia.estado) {
      cambios.push(`Estado → ${ETIQUETA_ESTADO[data.estado] ?? data.estado}`);
    }
    if (data.tecnicoId !== undefined && data.tecnicoId !== incidencia.tecnicoId) {
      cambios.push(data.tecnicoId ? 'Se asignó un técnico / encargado de laboratorio' : 'Sin técnico asignado');
    }
    if (data.solucion !== undefined && data.solucion !== incidencia.solucion) {
      cambios.push('Se registró la solución aplicada');
    }
    if (data.prioridad && data.prioridad !== incidencia.prioridad) {
      cambios.push(`Prioridad → ${data.prioridad}`);
    }

    if (cambios.length > 0) {
      await incidenciaRepository.agregarNotaSistema(id, `Actualización del ticket:\n• ${cambios.join('\n• ')}`);
    }

    return incidenciaRepository.obtenerPorId(id);
  }

  async agregarNota(data: AgregarNotaDTO) {
    const incidencia = await incidenciaRepository.obtenerPorId(data.incidenciaId);
    if (!incidencia) {
      throw new AppError('La incidencia solicitada no existe.', 404);
    }
    if (!data.mensaje?.trim()) {
      throw new AppError('La nota no puede estar vacía.', 400);
    }
    return incidenciaRepository.crearNota(data);
  }

  actualizarEvidencia(id: number, evidenciaUrl: string) {
    return prisma.incidencia.update({
      where: { id },
      data: { evidenciaUrl },
    });
  }
}

export const incidenciaService = new IncidenciaService();