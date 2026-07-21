import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';

const router = Router();

// ==========================================
// RUTAS DE FACULTADES
// ==========================================

// GET /api/catalogos/facultades
router.get('/facultades', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const facultades = await prisma.facultad.findMany({
      include: {
        _count: {
          select: { carreras: true },
        },
      },
      orderBy: { id: 'asc' },
    });
    res.status(200).json({ status: 'success', data: facultades });
  } catch (error) {
    next(error);
  }
});

// POST /api/catalogos/facultades
router.post('/facultades', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nombre, sigla } = req.body;
    const nuevaFacultad = await prisma.facultad.create({
      data: { nombre, sigla },
    });
    res.status(201).json({ status: 'success', data: nuevaFacultad });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// RUTAS DE CARRERAS
// ==========================================

// GET /api/catalogos/carreras
router.get('/carreras', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const carreras = await prisma.carrera.findMany({
      include: {
        facultad: {
          select: { id: true, nombre: true, sigla: true },
        },
      },
      orderBy: { id: 'asc' },
    });
    res.status(200).json({ status: 'success', data: carreras });
  } catch (error) {
    next(error);
  }
});

// POST /api/catalogos/carreras
router.post('/carreras', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nombre, sigla, facultadId } = req.body;
    const nuevaCarrera = await prisma.carrera.create({
      data: {
        nombre,
        sigla,
        facultadId: Number(facultadId),
      },
      include: {
        facultad: {
          select: { id: true, nombre: true, sigla: true },
        },
      },
    });
    res.status(201).json({ status: 'success', data: nuevaCarrera });
  } catch (error) {
    next(error);
  }
});

export default router;