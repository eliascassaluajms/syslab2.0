import { Request, Response, NextFunction } from 'express';
import { incidenciasService } from '../services/incidencias.service.js';
import { AppError } from '../utils/appError.js';
import { EstadoIncidencia, PrioridadIncidencia } from '@prisma/client';

// GET /api/incidencias
export const obtenerIncidencias = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const usuario = (req as any).user;
    const { laboratorioId, equipoId, estado, prioridad, solicitanteId, tecnicoId } = req.query;

    const filtros = {
      laboratorioId: laboratorioId ? Number(laboratorioId) : undefined,
      equipoId: equipoId ? Number(equipoId) : undefined,
      estado: estado ? (estado as EstadoIncidencia) : undefined,
      prioridad: prioridad ? (prioridad as PrioridadIncidencia) : undefined,
      solicitanteId: solicitanteId ? Number(solicitanteId) : undefined,
      tecnicoId: tecnicoId ? Number(tecnicoId) : undefined,
    };

    const incidencias = await incidenciasService.obtenerIncidencias(usuario, filtros);

    res.status(200).json({
      status: 'success',
      data: incidencias,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/incidencias/:id
export const obtenerIncidenciaPorId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      throw new AppError('El ID de la incidencia debe ser un número válido.', 400);
    }

    const usuario = (req as any).user;
    const incidencia = await incidenciasService.obtenerIncidenciaPorId(id, usuario);

    res.status(200).json({
      status: 'success',
      data: incidencia,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/incidencias
export const reportarIncidencia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const usuario = (req as any).user;
    const solicitanteId = Number(usuario.id);

    const { laboratorioId, equipoId, titulo, descripcion, prioridad } = req.body;

    const nuevaIncidencia = await incidenciasService.reportarIncidencia(
      solicitanteId,
      {
        laboratorioId: Number(laboratorioId),
        solicitanteId,
        equipoId: equipoId ? Number(equipoId) : undefined,
        titulo,
        descripcion,
        prioridad,
      },
      usuario
    );

    res.status(201).json({
      status: 'success',
      message: 'Incidencia reportada exitosamente.',
      data: nuevaIncidencia,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/incidencias/:id/estado o PATCH /api/incidencias/:id
export const actualizarEstadoIncidencia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      throw new AppError('El ID de la incidencia debe ser un número válido.', 400);
    }

    const usuario = (req as any).user;
    const { estado, prioridad, tecnicoId, asignadoAId, solucion } = req.body;

    const incidenciaActualizada = await incidenciasService.actualizarEstadoIncidencia(
      id,
      {
        estado,
        prioridad,
        tecnicoId: tecnicoId || asignadoAId ? Number(tecnicoId || asignadoAId) : undefined,
        solucion,
      },
      usuario
    );

    res.status(200).json({
      status: 'success',
      message: 'Incidencia actualizada correctamente.',
      data: incidenciaActualizada,
    });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/incidencias/:id
export const eliminarIncidencia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) {
      throw new AppError('El ID de la incidencia debe ser un número válido.', 400);
    }

    const usuario = (req as any).user;
    await incidenciasService.eliminarIncidencia(id, usuario);

    res.status(200).json({
      status: 'success',
      message: 'Incidencia eliminada correctamente.',
    });
  } catch (error) {
    next(error);
  }
};