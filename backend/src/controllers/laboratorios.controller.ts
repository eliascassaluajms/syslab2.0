import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';

// ==========================================
// 1. OBTENER TODOS LOS LABORATORIOS
// ==========================================
export const obtenerLaboratorios = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const laboratorios = await prisma.laboratorio.findMany({
      orderBy: { id: 'asc' },
    });
    res.status(200).json({ status: 'success', data: laboratorios });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. CREAR NUEVO LABORATORIO
// ==========================================
export const crearLaboratorio = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nombre, codigo, ubicacion, capacidad, descripcion } = req.body;

    const nuevoLab = await prisma.laboratorio.create({
      data: {
        nombre,
        codigo,
        ubicacion,
        capacidad: capacidad ? Number(capacidad) : 0,
        descripcion,
        activo: true, // Eliminación lógica por defecto activa
      },
    });

    res.status(201).json({ status: 'success', data: nuevoLab });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. ACTUALIZAR LABORATORIO
// ==========================================
export const actualizarLaboratorio = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { nombre, codigo, ubicacion, capacidad, descripcion } = req.body;

 
    const labActualizado = await prisma.laboratorio.update({
      where: { id: Number(id) },
      data: {
        nombre,
        codigo,
        ubicacion,
        capacidad: capacidad ? Number(capacidad) : 0,
        descripcion,
      },
    });

    res.status(200).json({ status: 'success', data: labActualizado });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 4. ELIMINACIÓN LÓGICA (CAMBIO DE ESTADO)
// ==========================================
export const cambiarEstadoLaboratorio = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    const labEstado = await prisma.laboratorio.update({
      where: { id: Number(id) },
      data: { activo: Boolean(activo) },
    });

    res.status(200).json({
      status: 'success',
      message: `El laboratorio ha sido ${labEstado.activo ? 'activado' : 'desactivado'} correctamente.`,
      data: labEstado,
    });
  } catch (error) {
    next(error);
  }
};