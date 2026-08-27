import { Request, Response, NextFunction } from 'express';
import { CategoriaEventoService } from '../services/categoriaEvento.service.js';

export const listar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const usuario = (req as any).usuario;
    const carreraId = req.query.carreraId ? Number(req.query.carreraId) : usuario?.carreraId;
    const tipo = req.query.tipo as any;

    const categorias = await CategoriaEventoService.listar(carreraId, tipo);
    res.status(200).json({ status: 'success', data: categorias });
  } catch (error) {
    next(error);
  }
};

export const obtenerPorId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const usuario = (req as any).usuario;
    const carreraId = usuario?.carreraId;

    const categoria = await CategoriaEventoService.obtenerPorId(id, carreraId);
    res.status(200).json({ status: 'success', data: categoria });
  } catch (error) {
    next(error);
  }
};

export const crear = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const usuario = (req as any).usuario;
    
    // Extraer carreraId del cuerpo, del usuario autenticado o de sus ámbitos
    const carreraId = req.body.carreraId 
      ? Number(req.body.carreraId) 
      : usuario?.carreraId || usuario?.ambito?.carreraId || usuario?.carrera?.id;

    const categoria = await CategoriaEventoService.crear({
      ...req.body,
      carreraId: carreraId ? Number(carreraId) : undefined,
    });

    res.status(201).json({ status: 'success', data: categoria });
  } catch (error) {
    next(error);
  }
};

export const actualizar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const usuario = (req as any).usuario;
    const carreraId = usuario?.carreraId;

    const categoria = await CategoriaEventoService.actualizar(id, carreraId, req.body);
    res.status(200).json({ status: 'success', data: categoria });
  } catch (error) {
    next(error);
  }
};

export const eliminar = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const usuario = (req as any).usuario;
    const carreraId = usuario?.carreraId;

    await CategoriaEventoService.eliminar(id, carreraId);
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
  eliminar,
};
