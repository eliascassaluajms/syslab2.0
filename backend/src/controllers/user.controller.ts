import { Request, Response, NextFunction } from 'express';
import { userRepository } from '../repositories/user.repository.js';
import { AppError } from '../utils/appError.js';
import { prisma } from '../config/prisma.js';

export const obtenerUsuarios = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        correo: true,
        activo: true,
        rol: { select: { nombre: true } },
        usuarioCarreras: { select: { carreraId: true } },
        usuarioFacultades: { select: { facultadId: true } }
      }
    });

    res.status(200).json({ status: 'success', data: usuarios });
  } catch (error) {
    next(error);
  }
};

export const modificarUsuarioYPerimetros = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { rolId, activo, facultades, carreras } = req.body;

    const usuarioIdNumerico = parseInt(id, 10);
    if (isNaN(usuarioIdNumerico)) {
      throw new AppError('El identificador del usuario debe ser un número entero válido.', 400);
    }

    // Validaciones estructurales básicas
    if (!rolId || !Array.isArray(facultades) || !Array.isArray(carreras)) {
      throw new AppError('Datos insuficientes. Se requiere rolId, y arreglos de facultades y carreras.', 400);
    }

    // Ejecutar la actualización transaccional en el repositorio con tipos numéricos correctos
    await userRepository.actualizarPerfilYPerimetros(usuarioIdNumerico, {
      rolId: parseInt(rolId, 10),
      activo,
      facultades: facultades.map((f: any) => parseInt(f, 10)),
      carreras: carreras.map((c: any) => parseInt(c, 10))
    });

    res.status(200).json({
      status: 'success',
      message: 'Usuario y ámbitos perimetrales actualizados con éxito.'
    });
  } catch (error) {
    next(error);
  }
};

export const cambiarEstadoUsuario = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    const usuarioIdNumerico = parseInt(id, 10);
    if (isNaN(usuarioIdNumerico)) {
      throw new AppError('El identificador del usuario debe ser un número entero válido.', 400);
    }

    if (activo === undefined) {
      throw new AppError('El campo activo es obligatorio.', 400);
    }

    await prisma.usuario.update({
      where: { id: usuarioIdNumerico },
      data: { activo: Boolean(activo) }
    });

    res.status(200).json({
      status: 'success',
      message: `Usuario ${activo ? 'activado' : 'desactivado'} correctamente.`
    });
  } catch (error) {
    next(error);
  }
};