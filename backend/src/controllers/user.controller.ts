import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/user.repository.js';
import { AppError } from '../utils/appError.js';
import { prisma } from '../config/prisma.js';

// 1. Obtener lista de usuarios registrados con sus roles y ámbitos perimetrales
export const obtenerUsuarios = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        correo: true,
        activo: true,
        esGlobal: true,
        rolId: true,
        rol: { select: { id: true, nombre: true } },
        asignacionesRoles: {
          select: {
            id: true, // ID de la asignación útil para eliminar si es necesario
            rolId: true,
            facultadId: true,
            carreraId: true,
            rol: { select: { id: true, nombre: true } },
            facultad: { select: { id: true, nombre: true, sigla: true } },
            carrera: { select: { id: true, nombre: true } }
          }
        }
      },
      orderBy: { id: 'desc' }
    });

    const resultado = usuarios.map((u: any) => {
      const rolesExtraidos = Array.isArray(u.asignacionesRoles)
        ? u.asignacionesRoles.map((a: any) => a.rol).filter(Boolean)
        : [];

      const rolesUnicos = Array.from(
        new Map(rolesExtraidos.map((r: any) => [r.id, r])).values()
      );

      if (u.rol && !rolesUnicos.some((r: any) => r.id === u.rol.id)) {
        rolesUnicos.unshift(u.rol);
      }

      const facultadesIds = Array.isArray(u.asignacionesRoles)
        ? Array.from(new Set(u.asignacionesRoles.map((a: any) => a.facultadId).filter(Boolean)))
        : [];

      const carrerasIds = Array.isArray(u.asignacionesRoles)
        ? Array.from(new Set(u.asignacionesRoles.map((a: any) => a.carreraId).filter(Boolean)))
        : [];

      return {
        id: u.id,
        nombre: u.nombre,
        correo: u.correo,
        activo: u.activo,
        esGlobal: u.esGlobal,
        rolId: u.rolId,
        rol: u.rol,
        roles: rolesUnicos.length > 0 ? rolesUnicos : (u.rol ? [u.rol] : []),
        asignacionesRoles: u.asignacionesRoles, // Detalle completo para la interfaz
        facultades: facultadesIds,
        carreras: carrerasIds
      };
    });

    res.status(200).json({ status: 'success', data: resultado });
  } catch (error) {
    next(error);
  }
};

// 2. Registrar usuario básico con asignación múltiple inicial
export const crearUsuarioBasico = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nombre, correo, password, rolIds, rolId } = req.body;

    if (!nombre || !correo || !password) {
      throw new AppError('El nombre, correo y contraseña son campos obligatorios.', 400);
    }

    const usuarioExistente = await prisma.usuario.findUnique({
      where: { correo: correo.trim().toLowerCase() }
    });

    if (usuarioExistente) {
      throw new AppError('El correo electrónico ya se encuentra registrado.', 400);
    }

    let idsRolesFinales: number[] = [];
    if (Array.isArray(rolIds) && rolIds.length > 0) {
      idsRolesFinales = rolIds.map((id: any) => parseInt(id, 10)).filter((id) => !isNaN(id));
    } else if (rolId) {
      const parsedRol = parseInt(rolId, 10);
      if (!isNaN(parsedRol)) idsRolesFinales.push(parsedRol);
    }

    if (idsRolesFinales.length === 0) {
      const rolDefecto = await prisma.rol.findFirst({
        where: { nombre: { in: ['Docente', 'Usuario', 'Personal'] } }
      }) || await prisma.rol.findFirst();

      if (!rolDefecto) {
        throw new AppError('No existen roles configurados en la base de datos.', 400);
      }
      idsRolesFinales.push(rolDefecto.id);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const nuevoUsuario = await prisma.$transaction(async (tx) => {
      const user = await tx.usuario.create({
        data: {
          nombre: nombre.trim(),
          correo: correo.trim().toLowerCase(),
          password: hashedPassword,
          rolId: idsRolesFinales[0],
          activo: true,
          esGlobal: false // Por defecto perimetralizado
        }
      });

      const asignaciones = idsRolesFinales.map((rId) => ({
        usuarioId: user.id,
        rolId: rId
      }));

      await tx.asignacionAmbito.createMany({
        data: asignaciones,
        skipDuplicates: true
      });

      return user;
    });

    res.status(201).json({
      status: 'success',
      message: 'Usuario registrado exitosamente.',
      data: nuevoUsuario
    });
  } catch (error) {
    next(error);
  }
};

// 3. Modificar perfil, roles múltiples y ámbitos perimetrales masivos
export const modificarUsuarioYPerimetros = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { rolIds, rolId, activo, facultades, carreras } = req.body;

    const usuarioIdNumerico = parseInt(id, 10);
    if (isNaN(usuarioIdNumerico)) {
      throw new AppError('El identificador del usuario debe ser un número entero válido.', 400);
    }

    let idsRolesNumericos: number[] = [];
    if (Array.isArray(rolIds)) {
      idsRolesNumericos = rolIds.map((r: any) => parseInt(r, 10)).filter((r) => !isNaN(r));
    } else if (rolId) {
      const parsed = parseInt(rolId, 10);
      if (!isNaN(parsed)) idsRolesNumericos.push(parsed);
    }

    if (idsRolesNumericos.length === 0) {
      throw new AppError('Debe asignar al menos un rol al usuario.', 400);
    }

    const idsFacultades = Array.isArray(facultades) ? facultades.map((f: any) => parseInt(f, 10)).filter((f) => !isNaN(f)) : [];
    const idsCarreras = Array.isArray(carreras) ? carreras.map((c: any) => parseInt(c, 10)).filter((c) => !isNaN(c)) : [];

    await userRepository.actualizarPerfilYPerimetros(usuarioIdNumerico, {
      rolId: idsRolesNumericos[0],
      rolIds: idsRolesNumericos,
      activo: activo !== undefined ? Boolean(activo) : undefined,
      facultades: idsFacultades,
      carreras: idsCarreras
    } as any);

    res.status(200).json({
      status: 'success',
      message: 'Usuario, roles y ámbitos perimetrales actualizados con éxito.'
    });
  } catch (error) {
    next(error);
  }
};

// 4. Endpoint específico para añadir un nuevo rol/cargo con el botón '+' (Asignación granular)
export const agregarRolAmbitoAdicional = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const usuarioId = parseInt(req.params.id, 10);
    const { rolId, facultadId, carreraId } = req.body;

    if (isNaN(usuarioId) || !rolId) {
      throw new AppError('El ID de usuario y el rolId son obligatorios.', 400);
    }

    const nuevaAsignacion = await prisma.asignacionAmbito.create({
      data: {
        usuarioId,
        rolId: parseInt(rolId, 10),
        facultadId: facultadId ? parseInt(facultadId, 10) : null,
        carreraId: carreraId ? parseInt(carreraId, 10) : null
      },
      include: {
        rol: true,
        facultad: true,
        carrera: true
      }
    });

    res.status(201).json({
      status: 'success',
      message: 'Cargo o rol adicional asignado correctamente.',
      data: nuevaAsignacion
    });
  } catch (error) {
    next(error);
  }
};

// 5. Habilitar / Inhabilitar estado de usuario
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