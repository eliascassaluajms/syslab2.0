import { Request, Response, NextFunction } from 'express';
import { equipoService } from '../services/equipo.service.js';
import { AppError } from '../utils/appError.js';
import { CategoriaActivo, EstadoActivo } from '@prisma/client';

export class EquipoController {
  async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { laboratorioId, categoria, estado, busqueda } = req.query;
      const data = await equipoService.listar({
        laboratorioId: laboratorioId ? Number(laboratorioId) : undefined,
        categoria: categoria as CategoriaActivo | undefined,
        estado: estado as EstadoActivo | undefined,
        busqueda: busqueda ? String(busqueda) : undefined,
      });
      res.status(200).json({ status: 'success', data });
    } catch (error) {
      next(error);
    }
  }

  async obtenerPorId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const data = await equipoService.obtenerPorId(Number(id));
      res.status(200).json({ status: 'success', data: { equipo: data } });
    } catch (error) {
      next(error);
    }
  }

  async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { laboratorioId, nombre, codigoPatrimonial, categoria, estado, marca, modelo, numeroSerie, ubicacionDetalle, descripcion } = req.body;
      if (!laboratorioId || !nombre) {
        throw new AppError('El laboratorio y el nombre del activo son obligatorios.', 400);
      }

      const equipo = await equipoService.crear({
        laboratorioId: Number(laboratorioId),
        nombre: String(nombre),
        codigoPatrimonial,
        categoria: categoria as CategoriaActivo | undefined,
        estado: estado as EstadoActivo | undefined,
        marca,
        modelo,
        numeroSerie,
        ubicacionDetalle,
        descripcion,
      });

      res.status(201).json({ status: 'success', message: 'Activo registrado exitosamente.', data: { equipo } });
    } catch (error) {
      next(error);
    }
  }

  async actualizar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const equipo = await equipoService.actualizar(Number(id), req.body);
      res.status(200).json({ status: 'success', message: 'Activo actualizado exitosamente.', data: { equipo } });
    } catch (error) {
      next(error);
    }
  }

  async eliminar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await equipoService.eliminar(Number(id));
      res.status(200).json({ status: 'success', message: 'Activo eliminado del inventario.' });
    } catch (error) {
      next(error);
    }
  }
}

export const equipoController = new EquipoController();
