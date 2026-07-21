import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import { userRepository } from '../repositories/user.repository.js';
import { AppError } from '../utils/appError.js';
import { prisma } from '../config/prisma.js';

// 1. Obtener lista de usuarios registrados con sus múltiples roles y ámbitos perimetrales
export const obtenerUsuarios = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        correo: true,
        activo: true,
        rolId: true,
        rol: { select: { id: true, nombre: true } },
        // ✅ CORREGIDO: Usamos la relación oficial asignacionesRoles de schema.prisma
        asignacionesRoles: {
          select: {
            rol: { select: { id: true, nombre: true } }
          }
        },
        usuarioCarreras: { select: { carreraId: true } },
        usuarioFacultades: { select: { facultadId: true } }
      },
      orderBy: { id: 'desc' }
    });

    // Formatear respuesta para simplificar consumo en Frontend
    const resultado = usuarios.map((u: any) => {
      // Mapear los roles asignados en el ámbito
      const rolesExtraidos = Array.isArray(u.asignacionesRoles)
        ? u.asignacionesRoles.map((ar: any) => ar.rol).filter(Boolean)
        : [];

      // Unificar el rol principal con los asignados evitando duplicados
      if (u.rol && !rolesExtraidos.some((r: any) => r.id === u.rol.id)) {
        rolesExtraidos.unshift(u.rol);
      }

      return {
        id: u.id,
        nombre: u.nombre,
        correo: u.correo,
        activo: u.activo,
        rolId: u.rolId,
        rol: u.rol,
        roles: rolesExtraidos.length > 0 ? rolesExtraidos : (u.rol ? [u.rol] : []),
        facultades: Array.isArray(u.usuarioFacultades) ? u.usuarioFacultades.map((uf: any) => uf.facultadId) : [],
        carreras: Array.isArray(u.usuarioCarreras) ? u.usuarioCarreras.map((uc: any) => uc.carreraId) : []
      };
    });

    res.status(200).json({ status: 'success', data: resultado });
  } catch (error) {
    next(error);
  }
};

// 2. Registrar usuario (Soporta asignación múltiple de roles con rol base por defecto)
export const crearUsuarioBasico = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nombre, correo, password, rolIds, rolId } = req.body;

    // Validación de campos obligatorios
    if (!nombre || !correo || !password) {
      throw new AppError('El nombre, correo y contraseña son campos obligatorios.', 400);
    }

    // Verificar si el correo ya está registrado
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { correo: correo.trim().toLowerCase() }
    });

    if (usuarioExistente) {
      throw new AppError('El correo electrónico ya se encuentra registrado.', 400);
    }

    // Normalizar arreglo de roles (Soporta 'rolIds' como array o 'rolId' individual)
    let idsRolesFinales: number[] = [];
    if (Array.isArray(rolIds) && rolIds.length > 0) {
      idsRolesFinales = rolIds.map((id: any) => parseInt(id, 10)).filter((id) => !isNaN(id));
    } else if (rolId) {
      const parsedRol = parseInt(rolId, 10);
      if (!isNaN(parsedRol)) idsRolesFinales.push(parsedRol);
    }

    // ROL POR DEFECTO: Si no se especifica ningún rol, asigna el rol base del sistema
    if (idsRolesFinales.length === 0) {
      const rolDefecto = await prisma.rol.findFirst({
        where: { nombre: { in: ['Docente', 'Usuario', 'Personal'] } }
      }) || await prisma.rol.findFirst();

      if (!rolDefecto) {
        throw new AppError('No existen roles configurados en la base de datos.', 400);
      }
      idsRolesFinales.push(rolDefecto.id);
    }

    // Hash de contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Creación transaccional del usuario con sus relaciones
    const nuevoUsuario = await prisma.$transaction(async (tx) => {
      const user = await tx.usuario.create({
        data: {
          nombre: nombre.trim(),
          correo: correo.trim().toLowerCase(),
          password: hashedPassword,
          rolId: idsRolesFinales[0],
          activo: true
        }
      });

      // ✅ CORREGIDO: Insertar relaciones en asignacionAmbito
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

    // Consultar usuario completo recién creado
    const usuarioCreado: any = await prisma.usuario.findUnique({
      where: { id: nuevoUsuario.id },
      select: {
        id: true,
        nombre: true,
        correo: true,
        activo: true,
        rol: { select: { id: true, nombre: true } },
        asignacionesRoles: {
          select: {
            rol: { select: { id: true, nombre: true } }
          }
        }
      }
    });

    const rolesFormateados = Array.isArray(usuarioCreado?.asignacionesRoles)
      ? usuarioCreado.asignacionesRoles.map((ar: any) => ar.rol).filter(Boolean)
      : [];

    if (usuarioCreado?.rol && !rolesFormateados.some((r: any) => r.id === usuarioCreado.rol.id)) {
      rolesFormateados.unshift(usuarioCreado.rol);
    }

    res.status(201).json({
      status: 'success',
      message: 'Usuario registrado exitosamente.',
      data: {
        id: usuarioCreado?.id,
        nombre: usuarioCreado?.nombre,
        correo: usuarioCreado?.correo,
        activo: usuarioCreado?.activo,
        rol: usuarioCreado?.rol,
        roles: rolesFormateados
      }
    });
  } catch (error) {
    next(error);
  }
};

// 3. Modificar perfil, roles múltiples y asignaciones perimetrales (Facultades y Carreras)
export const modificarUsuarioYPerimetros = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { rolIds, rolId, activo, facultades, carreras } = req.body;

    const usuarioIdNumerico = parseInt(id, 10);
    if (isNaN(usuarioIdNumerico)) {
      throw new AppError('El identificador del usuario debe ser un número entero válido.', 400);
    }

    // Normalizar roles recibidos
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

    if (!Array.isArray(facultades) || !Array.isArray(carreras)) {
      throw new AppError('Se requieren arreglos válidos para facultades y carreras.', 400);
    }

    const idsFacultades = facultades.map((f: any) => parseInt(f, 10)).filter((f) => !isNaN(f));
    const idsCarreras = carreras.map((c: any) => parseInt(c, 10)).filter((c) => !isNaN(c));

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

// 4. Habilitar / Inhabilitar estado de usuario
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