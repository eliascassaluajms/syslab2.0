import { Request, Response, NextFunction } from 'express';
import { CategoriaEventoService } from '../services/categoriaEvento.service.js';

export const listar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tipo = req.query.tipo as any;
    // Se pasa undefined en lugar de carreraId para obtener las categorías globales
    const categorias = await CategoriaEventoService.listar(undefined, tipo);
    
    const rawData = Array.isArray(categorias) ? categorias : (categorias as any)?.data || [];
    
    // Normalización de compatibilidad para el frontend
    const data = rawData.map((cat: any) => {
      const estaActivo = Boolean(cat.activo);
      return {
        ...cat,
        activo: estaActivo,
        activa: estaActivo,
        estado: estaActivo ? 'ACTIVO' : 'INACTIVO',
      };
    });

    res.status(200).json({ status: 'success', data });
  } catch (error) {
    next(error);
  }
};

export const obtenerPorId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const categoria = await CategoriaEventoService.obtenerPorId(id, undefined);
    const estaActivo = Boolean((categoria as any)?.activo);
    res.status(200).json({
      status: 'success',
      data: {
        ...categoria,
        activo: estaActivo,
        activa: estaActivo,
        estado: estaActivo ? 'ACTIVO' : 'INACTIVO',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const crear = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categoria = await CategoriaEventoService.crear({
      ...req.body,
      carreraId: req.body.carreraId || null, 
    });
    const estaActivo = Boolean((categoria as any)?.activo);
    res.status(201).json({
      status: 'success',
      data: {
        ...categoria,
        activo: estaActivo,
        activa: estaActivo,
        estado: estaActivo ? 'ACTIVO' : 'INACTIVO',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const actualizar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const categoria = await CategoriaEventoService.actualizar(id, undefined, req.body);
    const estaActivo = Boolean((categoria as any)?.activo);
    res.status(200).json({
      status: 'success',
      data: {
        ...categoria,
        activo: estaActivo,
        activa: estaActivo,
        estado: estaActivo ? 'ACTIVO' : 'INACTIVO',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const cambiarEstado = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);

    const categoriaActual = await CategoriaEventoService.obtenerPorId(id, undefined);
    if (!categoriaActual) {
      res.status(404).json({ status: 'fail', message: 'La categoría no existe.' });
      return;
    }

    // Determinar el nuevo estado (invierte el actual si no viene explícito)
    const nuevoEstado = req.body.activo !== undefined
      ? Boolean(req.body.activo)
      : (req.body.estado !== undefined ? String(req.body.estado).toUpperCase() === 'ACTIVO' : !(categoriaActual as any).activo);

    // Actualizar únicamente el campo activo
    const actualizada = await CategoriaEventoService.actualizar(id, undefined, {
      activo: nuevoEstado,
    });

    res.status(200).json({
      status: 'success',
      message: `Categoría ${nuevoEstado ? 'activada' : 'desactivada'} exitosamente.`,
      data: {
        ...actualizada,
        activo: nuevoEstado,
        activa: nuevoEstado,
        estado: nuevoEstado ? 'ACTIVO' : 'INACTIVO',
      },
    });
  } catch (error) {
    next(error);
  }
};

export const eliminar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    await CategoriaEventoService.eliminar(id, undefined);
    res.status(200).json({ status: 'success', message: 'Categoría eliminada correctamente.' });
  } catch (error) {
    next(error);
  }
};

export const CategoriaEventoController = {
  listar,
  obtenerPorId,
  crear,
  actualizar,
  cambiarEstado,
  eliminar,
};