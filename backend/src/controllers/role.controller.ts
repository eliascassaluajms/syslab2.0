import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/appError.js';

// 1. Obtener todos los roles con sus permisos asignados
export const obtenerRoles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roles = await prisma.rol.findMany({
      include: {
        rolPermisos: {
          select: {
            permiso: {
              select: {
                id: true,
                codigo: true,
                descripcion: true,
              },
            },
          },
        },
        _count: {
          select: { usuarios: true },
        },
      },
      orderBy: { id: 'asc' },
    });

    // Formatear respuesta para simplificar el consumo en Frontend
    const resultado = roles.map((r) => ({
      id: r.id,
      nombre: r.nombre,
      descripcion: r.descripcion,
      totalUsuarios: r._count.usuarios,
      permisos: r.rolPermisos.map((rp) => rp.permiso),
    }));

    res.status(200).json({ status: 'success', data: resultado });
  } catch (error) {
    next(error);
  }
};

// 2. Obtener un rol por ID
export const obtenerRolPorId = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const rolId = parseInt(id, 10);

    if (isNaN(rolId)) {
      throw new AppError('El ID del rol debe ser un número entero válido.', 400);
    }

    const rol = await prisma.rol.findUnique({
      where: { id: rolId },
      include: {
        rolPermisos: {
          select: {
            permisoId: true,
            permiso: true,
          },
        },
      },
    });

    if (!rol) {
      throw new AppError('El rol especificado no existe.', 404);
    }

    res.status(200).json({
      status: 'success',
      data: {
        id: rol.id,
        nombre: rol.nombre,
        descripcion: rol.descripcion,
        permisoIds: rol.rolPermisos.map((rp) => rp.permisoId),
        permisos: rol.rolPermisos.map((rp) => rp.permiso),
      },
    });
  } catch (error) {
    next(error);
  }
};

// 3. Crear un nuevo Rol (con asignación opcional de permisos)
export const crearRol = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nombre, descripcion, permisoIds } = req.body;

    if (!nombre || nombre.trim() === '') {
      throw new AppError('El nombre del rol es obligatorio.', 400);
    }

    // Verificar si ya existe un rol con ese nombre
    const existeRol = await prisma.rol.findUnique({
      where: { nombre: nombre.trim() },
    });

    if (existeRol) {
      throw new AppError(`Ya existe un rol con el nombre "${nombre}".`, 400);
    }

    // Creación transaccional con asignación de permisos
    const nuevoRol = await prisma.$transaction(async (tx) => {
      const rol = await tx.rol.create({
        data: {
          nombre: nombre.trim(),
          descripcion: descripcion ? descripcion.trim() : null,
        },
      });

      if (Array.isArray(permisoIds) && permisoIds.length > 0) {
        const relaciones = permisoIds.map((pId: number) => ({
          rolId: rol.id,
          permisoId: parseInt(pId as any, 10),
        }));

        await tx.rolPermiso.createMany({
          data: relaciones,
        });
      }

      return rol;
    });

    res.status(201).json({
      status: 'success',
      message: 'Rol creado exitosamente.',
      data: nuevoRol,
    });
  } catch (error) {
    next(error);
  }
};

// 4. Actualizar Rol y sincronizar matriz de permisos
export const actualizarRol = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, permisoIds } = req.body;
    const rolId = parseInt(id, 10);

    if (isNaN(rolId)) {
      throw new AppError('El ID del rol debe ser un número entero válido.', 400);
    }

    const rolExistente = await prisma.rol.findUnique({ where: { id: rolId } });
    if (!rolExistente) {
      throw new AppError('El rol a actualizar no existe.', 404);
    }

    // Proteger el rol 'Administrador' crítico
    if (rolExistente.nombre === 'Administrador' && nombre && nombre !== 'Administrador') {
      throw new AppError('No se puede cambiar el nombre del rol Administrador del sistema.', 400);
    }

    await prisma.$transaction(async (tx) => {
      // 1. Actualizar datos básicos
      await tx.rol.update({
        where: { id: rolId },
        data: {
          nombre: nombre ? nombre.trim() : undefined,
          descripcion: descripcion !== undefined ? descripcion.trim() : undefined,
        },
      });

      // 2. Sincronizar permisos si se enviaron en el body
      if (Array.isArray(permisoIds)) {
        // Eliminar relaciones previas
        await tx.rolPermiso.deleteMany({
          where: { rolId },
        });

        // Crear nuevas relaciones
        if (permisoIds.length > 0) {
          const nuevasRelaciones = permisoIds.map((pId: number) => ({
            rolId,
            permisoId: parseInt(pId as any, 10),
          }));
          await tx.rolPermiso.createMany({ data: nuevasRelaciones });
        }
      }
    });

    res.status(200).json({
      status: 'success',
      message: 'Rol y matriz de permisos actualizados correctamente.',
    });
  } catch (error) {
    next(error);
  }
};

// 5. Eliminar Rol
export const eliminarRol = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const rolId = parseInt(id, 10);

    if (isNaN(rolId)) {
      throw new AppError('El ID del rol debe ser un número entero válido.', 400);
    }

    const rol = await prisma.rol.findUnique({
      where: { id: rolId },
      include: { _count: { select: { usuarios: true } } },
    });

    if (!rol) {
      throw new AppError('El rol a eliminar no existe.', 404);
    }

    if (rol.nombre === 'Administrador') {
      throw new AppError('El rol "Administrador" es del sistema y no puede ser eliminado.', 400);
    }

    if (rol._count.usuarios > 0) {
      throw new AppError(
        `No se puede eliminar el rol porque está asignado a ${rol._count.usuarios} usuario(s). Reasigne los usuarios primero.`,
        400
      );
    }

    await prisma.rol.delete({
      where: { id: rolId },
    });

    res.status(200).json({
      status: 'success',
      message: 'Rol eliminado correctamente.',
    });
  } catch (error) {
    next(error);
  }
};

// 6. Obtener catálogo completo de permisos disponibles (para construir los checkboxes)
export const obtenerPermisos = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const permisos = await prisma.permiso.findMany({
      orderBy: { codigo: 'asc' },
    });

    res.status(200).json({ status: 'success', data: permisos });
  } catch (error) {
    next(error);
  }
};