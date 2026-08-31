import { NextFunction, Request, Response } from 'express';
import { horarioService } from '../services/horario.service.js';
import { AppError } from '../utils/appError.js';

export class HorarioController {
  async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { laboratorioId, materiaId, docenteId, diaSemana, horaInicio, horaFin, semestre, gestion, grupo, totalGrupos } = req.body;

      if (!laboratorioId || !materiaId || !docenteId || !diaSemana || !horaInicio || !horaFin || !semestre || !gestion) {
        throw new AppError('Faltan datos obligatorios para crear el horario.', 400);
      }

      const nuevoHorario = await horarioService.crear({
        laboratorioId: Number(laboratorioId),
        materiaId: Number(materiaId),
        docenteId: Number(docenteId),
        diaSemana: String(diaSemana),
        horaInicio: String(horaInicio),
        horaFin: String(horaFin),
        semestre: Number(semestre),
        gestion: Number(gestion),
        grupo: grupo !== undefined ? Number(grupo) : undefined,
        totalGrupos: totalGrupos !== undefined ? Number(totalGrupos) : undefined,
      });

      res.status(201).json({
        status: 'success',
        data: { horario: nuevoHorario },
      });
    } catch (error) {
      next(error);
    }
  }

  async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filtros = {
        docenteId: req.query.docenteId ? Number(req.query.docenteId) : undefined,
        laboratorioId: req.query.laboratorioId ? Number(req.query.laboratorioId) : undefined,
        diaSemana: req.query.diaSemana ? String(req.query.diaSemana) : undefined,
        semestre: req.query.semestre ? Number(req.query.semestre) : undefined,
        gestion: req.query.gestion ? Number(req.query.gestion) : undefined,
      };

      const horarios = await horarioService.listar(filtros);

      res.status(200).json({
        status: 'success',
        results: horarios.length,
        data: { horarios },
      });
    } catch (error) {
      next(error);
    }
  }

  async obtenerPorId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const horario = await horarioService.obtenerPorId(Number(id));

      res.status(200).json({
        status: 'success',
        data: { horario },
      });
    } catch (error) {
      next(error);
    }
  }

  async actualizar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { laboratorioId, materiaId, docenteId, diaSemana, horaInicio, horaFin, semestre, gestion, grupo, totalGrupos } = req.body;

      const horarioActualizado = await horarioService.actualizar(Number(id), {
        laboratorioId: laboratorioId !== undefined ? Number(laboratorioId) : undefined,
        materiaId: materiaId !== undefined ? Number(materiaId) : undefined,
        docenteId: docenteId !== undefined ? Number(docenteId) : undefined,
        diaSemana: diaSemana !== undefined ? String(diaSemana) : undefined,
        horaInicio: horaInicio !== undefined ? String(horaInicio) : undefined,
        horaFin: horaFin !== undefined ? String(horaFin) : undefined,
        semestre: semestre !== undefined ? Number(semestre) : undefined,
        gestion: gestion !== undefined ? Number(gestion) : undefined,
        grupo: grupo !== undefined ? Number(grupo) : undefined,
        totalGrupos: totalGrupos !== undefined ? Number(totalGrupos) : undefined,
      });

      res.status(200).json({
        status: 'success',
        data: { horario: horarioActualizado },
      });
    } catch (error) {
      next(error);
    }
  }

  async eliminar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await horarioService.eliminar(Number(id));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const horarioController = new HorarioController();
