import { Request, Response, NextFunction } from 'express';
import { incidenciaService } from '../services/incidencia.service.js';
import { AppError } from '../utils/appError.js';
import { EstadoIncidencia, PrioridadIncidencia, TipoIncidencia, CategoriaEquipoIncidencia } from '@prisma/client';

interface ReqUsuario {
  id?: number;
  permisos?: string[];
  esGlobal?: boolean;
}

const usuarioDe = (req: Request): ReqUsuario => (req as any).user;

const tieneAccesoGlobal = (user: ReqUsuario): boolean => {
  if (user?.esGlobal) return true;
  return Array.isArray(user?.permisos)
    ? (user.permisos?.includes('fallas:ver_reportes') ?? false)
    : false;
};

export class IncidenciaController {
  async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = usuarioDe(req);
      const accesoGlobal = tieneAccesoGlobal(user);

      const resultado = await incidenciaService.listar({
        solicitanteId: accesoGlobal ? undefined : user?.id,
        estado: req.query.estado as EstadoIncidencia | undefined,
        prioridad: req.query.prioridad as PrioridadIncidencia | undefined,
        tipo: req.query.tipo as TipoIncidencia | undefined,
        laboratorioId: req.query.laboratorioId ? Number(req.query.laboratorioId) : undefined,
      });

      res.status(200).json({ status: 'success', data: resultado });
    } catch (error) {
      next(error);
    }
  }

  async listarMisReportes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = usuarioDe(req);
      const resultado = await incidenciaService.listarMisReportes(
        Number(user?.id),
        req.query.estado as EstadoIncidencia | undefined,
      );
      res.status(200).json({ status: 'success', data: resultado });
    } catch (error) {
      next(error);
    }
  }

  async obtenerPorId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = usuarioDe(req);
      const accesoGlobal = tieneAccesoGlobal(user);
      const incidencia = await incidenciaService.obtenerPorId(
        Number(req.params.id),
        Number(user?.id),
        accesoGlobal,
      );
      res.status(200).json({ status: 'success', data: { incidencia } });
    } catch (error) {
      next(error);
    }
  }

  async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { laboratorioId, equipoId, titulo, descripcion, prioridad, tipo, categoriaEquipo, clienteUuid } = req.body;
      if (!laboratorioId || !titulo || !descripcion) {
        throw new AppError('Laboratorio, título y descripción son obligatorios.', 400);
      }

      const resultado = await incidenciaService.crear({
        clienteUuid: clienteUuid ? String(clienteUuid) : undefined,
        laboratorioId: Number(laboratorioId),
        solicitanteId: Number(usuarioDe(req).id),
        equipoId: equipoId ? Number(equipoId) : null,
        titulo: String(titulo),
        descripcion: String(descripcion),
        tipo: tipo as TipoIncidencia | undefined,
        categoriaEquipo: categoriaEquipo as CategoriaEquipoIncidencia | undefined,
        prioridad: prioridad as PrioridadIncidencia | undefined,
      });

      const { incidencia, duplicada } = resultado;
      res.status(duplicada ? 200 : 201).json({
        status: 'success',
        message: duplicada
          ? 'La incidencia ya estaba registrada; se devuelve el ticket existente.'
          : 'Incidencia reportada correctamente.',
        data: { incidencia, duplicada },
      });
    } catch (error) {
      next(error);
    }
  }

  async gestionar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { estado, tecnicoId, solucion, prioridad, tipo, categoriaEquipo } = req.body;
      const user = usuarioDe(req);
      const accesoGlobal = tieneAccesoGlobal(user);

      const incidencia = await incidenciaService.obtenerPorId(Number(id), Number(user?.id), accesoGlobal);

      const actualizada = await incidenciaService.gestionar(Number(id), {
        estado: estado as EstadoIncidencia | undefined,
        tecnicoId: tecnicoId !== undefined ? (tecnicoId ? Number(tecnicoId) : null) : undefined,
        solucion: solucion !== undefined ? String(solucion) : undefined,
        prioridad: prioridad as PrioridadIncidencia | undefined,
        tipo: tipo as TipoIncidencia | undefined,
        categoriaEquipo: categoriaEquipo as CategoriaEquipoIncidencia | undefined,
      });

      res.status(200).json({ status: 'success', message: 'Incidencia actualizada con éxito.', data: { incidencia: actualizada } });
    } catch (error) {
      next(error);
    }
  }

  async agregarNota(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = usuarioDe(req);
      const incidenciaId = Number(req.params.id);
      const previa = await incidenciaService.obtenerPorId(incidenciaId, Number(user?.id), tieneAccesoGlobal(user));

      const nota = await incidenciaService.agregarNota({
        incidenciaId,
        autorId: Number(user?.id),
        mensaje: String(req.body.mensaje ?? ''),
      });

      res.status(201).json({
        status: 'success',
        message: 'Nota agregada correctamente.',
        data: { nota, incidenciaId: previa.id },
      });
    } catch (error) {
      next(error);
    }
  }

  async subirEvidencia(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = Number(req.params.id);
      const archivo = (req as any).file;

      if (!archivo) {
        throw new AppError('Debe adjuntar una imagen como evidencia.', 400);
      }

      const user = usuarioDe(req);
      const previa = await incidenciaService.obtenerPorId(id, Number(user?.id), tieneAccesoGlobal(user));

      const evidenciaUrl = `/api/documentos/incidencias/${archivo.filename}`;
      const incidencia = await incidenciaService.actualizarEvidencia(id, evidenciaUrl);

      res.status(200).json({
        status: 'success',
        message: 'Evidencia adjuntada correctamente.',
        data: { incidencia, evidenciaUrl: incidencia.evidenciaUrl ?? previa.evidenciaUrl },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const incidenciaController = new IncidenciaController();