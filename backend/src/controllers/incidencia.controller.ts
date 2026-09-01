import { Request, Response, NextFunction } from 'express';
import { incidenciaService } from '../services/incidencia.service.js';
import { AppError } from '../utils/appError.js';
import { EstadoIncidencia, PrioridadIncidencia } from '@prisma/client';

export class IncidenciaController {
  async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = (req as any).user;
      const tieneReporteGlobal = user?.permisos?.includes('fallas:ver_reportes');

      const resultado = await incidenciaService.listar({
        solicitanteId: tieneReporteGlobal ? undefined : user?.id,
        estado: req.query.estado as EstadoIncidencia | undefined,
        prioridad: req.query.prioridad as PrioridadIncidencia | undefined,
        laboratorioId: req.query.laboratorioId ? Number(req.query.laboratorioId) : undefined,
      });

      res.status(200).json({ status: 'success', data: resultado });
    } catch (error) {
      next(error);
    }
  }

  async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { laboratorioId, equipoId, titulo, descripcion, prioridad } = req.body;
      if (!laboratorioId || !titulo || !descripcion) {
        throw new AppError('Laboratorio, título y descripción son obligatorios.', 400);
      }

      const incidencia = await incidenciaService.crear({
        laboratorioId: Number(laboratorioId),
        solicitanteId: Number((req as any).user?.id),
        equipoId: equipoId ? Number(equipoId) : null,
        titulo: String(titulo),
        descripcion: String(descripcion),
        prioridad: prioridad as PrioridadIncidencia | undefined,
      });

      res.status(201).json({ status: 'success', message: 'Incidencia reportada correctamente.', data: { incidencia } });
    } catch (error) {
      next(error);
    }
  }

  async gestionar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { estado, tecnicoId, solucion, prioridad } = req.body;

      const incidencia = await incidenciaService.gestionar(Number(id), {
        estado: estado as EstadoIncidencia | undefined,
        tecnicoId: tecnicoId !== undefined ? (tecnicoId ? Number(tecnicoId) : null) : undefined,
        solucion: solucion ? String(solucion) : null,
        prioridad: prioridad as PrioridadIncidencia | undefined,
      });

      res.status(200).json({ status: 'success', message: 'Incidencia actualizada con éxito.', data: { incidencia } });
    } catch (error) {
      next(error);
    }
  }
}

export const incidenciaController = new IncidenciaController();
