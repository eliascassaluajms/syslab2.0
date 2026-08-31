import { NextFunction, Request, Response } from 'express';
import { solicitudExtraordinariaService, EstadoSolicitud } from '../services/solicitudExtraordinaria.service.js';
import { AppError } from '../utils/appError.js';

export class SolicitudExtraordinariaController {
  async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        laboratorioId,
        docenteId,
        solicitadoPorDirector,
        nombreAyudante,
        materia,
        fecha,
        horaInicio,
        horaFin,
        motivo,
      } = req.body;

      const idDocenteFinal = docenteId ? Number(docenteId) : (req.user?.id ? Number(req.user.id) : undefined);

      const solicitud = await solicitudExtraordinariaService.crear({
        laboratorioId: Number(laboratorioId),
        docenteId: idDocenteFinal,
        solicitadoPorDirector: Boolean(solicitadoPorDirector),
        nombreAyudante: nombreAyudante ? String(nombreAyudante) : undefined,
        materia: String(materia || ''),
        fecha: String(fecha || ''),
        horaInicio: String(horaInicio || ''),
        horaFin: String(horaFin || ''),
        motivo: String(motivo || ''),
      });

      res.status(201).json({
        status: 'success',
        data: { solicitud },
      });
    } catch (error) {
      next(error);
    }
  }

  async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filtros = {
        estado: req.query.estado ? (req.query.estado as EstadoSolicitud) : undefined,
        laboratorioId: req.query.laboratorioId ? Number(req.query.laboratorioId) : undefined,
        fecha: req.query.fecha ? String(req.query.fecha) : undefined,
      };

      const solicitudes = await solicitudExtraordinariaService.listar(filtros);

      res.status(200).json({
        status: 'success',
        results: solicitudes.length,
        data: { solicitudes },
      });
    } catch (error) {
      next(error);
    }
  }

  async actualizarEstado(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { estado } = req.body;

      if (!estado) {
        throw new AppError('Debe especificar el nuevo estado ("APROBADO" o "RECHAZADO").', 400);
      }

      const solicitudActualizada = await solicitudExtraordinariaService.actualizarEstado(
        Number(id),
        estado as EstadoSolicitud
      );

      res.status(200).json({
        status: 'success',
        data: { solicitud: solicitudActualizada },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const solicitudExtraordinariaController = new SolicitudExtraordinariaController();
