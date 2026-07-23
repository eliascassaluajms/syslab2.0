import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { ScopeService } from '../services/scope.service.js';

// ==========================================
// 1. OBTENER LABORATORIOS (FILTRADO POR ÁMBITO)
// ==========================================
export const obtenerLaboratorios = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const usuario = (req as any).user;

    let whereCondition: any = {};

    // Si el usuario no es Administrador Global, aplicamos el filtro de ámbito
    if (usuario && !usuario.esGlobal) {
      if (usuario.ambitoId && usuario.tipoAmbito) {
        // Obtenemos los IDs de carreras según el ámbito (FACULTAD o CARRERA)
        const carreraIds = await ScopeService.resolverCarrerasPorAmbito(
          usuario.ambitoId,
          usuario.tipoAmbito
        );

        whereCondition = {
          OR: [
            { carreraId: { in: carreraIds } },
            // También incluimos laboratorios de ámbito general de la Facultad (carreraId null)
            { facultadId: usuario.facultadId, carreraId: null },
          ],
        };
      } else if (usuario.facultadId) {
        whereCondition = { facultadId: usuario.facultadId };
      }
    }

    const laboratorios = await prisma.laboratorio.findMany({
      where: whereCondition,
      include: {
        facultad: {
          select: { id: true, nombre: true, sigla: true },
        },
        carrera: {
          select: { id: true, nombre: true },
        },
      },
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
    const { nombre, codigo, ubicacion, capacidad, descripcion, facultadId, carreraId } = req.body;

    const nuevoLab = await prisma.laboratorio.create({
      data: {
        nombre,
        codigo,
        ubicacion,
        capacidad: capacidad ? Number(capacidad) : 0,
        descripcion,
        facultadId: Number(facultadId),
        carreraId: carreraId ? Number(carreraId) : null,
        activo: true,
      },
      include: {
        facultad: { select: { id: true, nombre: true, sigla: true } },
        carrera: { select: { id: true, nombre: true } },
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
    const { nombre, codigo, ubicacion, capacidad, descripcion, facultadId, carreraId } = req.body;

    const labActualizado = await prisma.laboratorio.update({
      where: { id: Number(id) },
      data: {
        nombre,
        codigo,
        ubicacion,
        capacidad: capacidad ? Number(capacidad) : 0,
        descripcion,
        facultadId: facultadId ? Number(facultadId) : undefined,
        carreraId: carreraId !== undefined ? (carreraId ? Number(carreraId) : null) : undefined,
      },
      include: {
        facultad: { select: { id: true, nombre: true, sigla: true } },
        carrera: { select: { id: true, nombre: true } },
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