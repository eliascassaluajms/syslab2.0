import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/appError.js';
import bcrypt from 'bcryptjs';

export class UserService {
  // 1. Listar todos los usuarios con sus roles y ámbitos perimetrales
  async listarUsuarios() {
    return await prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        correo: true,
        esGlobal: true,
        activo: true,
        creadoEn: true,
        asignacionesRoles: {
          include: {
            rol: { select: { id: true, nombre: true } },
            facultad: { select: { id: true, nombre: true, sigla: true } },
            carrera: { select: { id: true, nombre: true } },
          },
        },
      },
      orderBy: { id: 'asc' },
    });
  }

  // 2. Agregar un nuevo rol y ámbito a un usuario existente (Ej: Asignar cargo de Director o Jefe de Lab)
  async agregarAsignacionAmbito(usuarioId: number, data: { rolId: number; facultadId?: number; carreraId?: number }) {
    // Validar que el usuario exista
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario) {
      throw new AppError('El usuario especificado no existe.', 404);
    }

    // Validar que el rol exista
    const rol = await prisma.rol.findUnique({ where: { id: data.rolId } });
    if (!rol) {
      throw new AppError('El rol seleccionado no es válido.', 400);
    }

    // Crear la nueva asignación perimetral evitando duplicados exactos
    return await prisma.asignacionAmbito.create({
      data: {
        usuarioId,
        rolId: data.rolId,
        facultadId: data.facultadId || null,
        carreraId: data.carreraId || null,
      },
      include: {
        rol: true,
        facultad: true,
        carrera: true,
      },
    });
  }

  // 3. Eliminar una asignación específica de rol/ámbito
  async eliminarAsignacionAmbito(asignacionId: number) {
    const asignacion = await prisma.asignacionAmbito.findUnique({ where: { id: asignacionId } });
    if (!asignacion) {
      throw new AppError('La asignación de ámbito no existe.', 404);
    }

    return await prisma.asignacionAmbito.delete({
      where: { id: asignacionId },
    });
  }

  // 4. Actualizar datos generales del usuario (Nombre, Correo, Estado)
  async actualizarUsuario(usuarioId: number, data: { nombre?: string; correo?: string; activo?: boolean }) {
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario) {
      throw new AppError('Usuario no encontrado.', 404);
    }

    return await prisma.usuario.update({
      where: { id: usuarioId },
      data: {
        nombre: data.nombre !== undefined ? data.nombre : usuario.nombre,
        correo: data.correo !== undefined ? data.correo : usuario.correo,
        activo: data.activo !== undefined ? data.activo : usuario.activo,
      },
    });
  }

  // 5. Dar de baja lógica a un usuario (Desactivar cuenta)
  async cambiarEstadoUsuario(usuarioId: number, activo: boolean) {
    const usuario = await prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!usuario) {
      throw new AppError('Usuario no encontrado.', 404);
    }

    return await prisma.usuario.update({
      where: { id: usuarioId },
      data: { activo },
    });
  }
}

export const userService = new UserService();