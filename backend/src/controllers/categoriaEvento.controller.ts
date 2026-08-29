import { Request, Response, NextFunction } from 'express';
import { CategoriaEventoService } from '../services/categoriaEvento.service.js';

export const listar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tipo = req.query.tipo as any;
    // Se pasa undefined en lugar de carreraId para obtener las categorías globales
    const categorias = await CategoriaEventoService.listar(undefined, tipo);
    
    const data = Array.isArray(categorias) ? categorias : (categorias as any)?.data || [];
    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};

export const obtenerPorId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    // Ya no restringimos por carreraId
    const categoria = await CategoriaEventoService.obtenerPorId(id, undefined);
    res.status(200).json({ status: 'success', data: categoria });
  } catch (error) {
    next(error);
  }
};

export const crear = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Al crear, forzamos que carreraId sea null/undefined para que nazca como global
    const categoria = await CategoriaEventoService.crear({
      ...req.body,
      carreraId: null, 
    });

    res.status(201).json({ status: 'success', data: categoria });
  } catch (error) {
    next(error);
  }
};

export const actualizar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const categoria = await CategoriaEventoService.actualizar(id, undefined, req.body);
    res.status(200).json({ status: 'success', data: categoria });
  } catch (error) {
    next(error);
  }
};

export const cambiarEstado = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const { activo, estado } = req.body;
    
    const isActivo = activo !== undefined 
      ? Boolean(activo) 
      : (estado !== undefined ? String(estado).toUpperCase() === 'ACTIVO' : true);

    const categoria = await CategoriaEventoService.actualizar(id, undefined, {
      ...req.body,
      activo: isActivo,
    });

    res.status(200).json({ status: 'success', data: categoria });
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