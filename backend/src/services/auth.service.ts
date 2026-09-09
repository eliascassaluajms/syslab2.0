import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/appError.js';
import { ScopeService } from './scope.service.js';

export class AuthService {
  async login(identificador: string, passwordPlain: string) {
    const term = identificador.trim().toLowerCase();
    const user = await prisma.usuario.findFirst({
      where: {
        OR: [
          { correo: term },
          { username: term },
        ]
      },
      include: {
        asignacionesRoles: {
          include: {
            rol: {
              include: {
                rolPermisos: {
                  include: { permiso: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new AppError('Credenciales incorrectas.', 401);
    }

    if (!user.activo) {
      throw new AppError('Esta cuenta se encuentra suspendida. Contacte al Administrador.', 403);
    }

    const isPasswordValid = await bcrypt.compare(passwordPlain, user.password);
    if (!isPasswordValid) {
      throw new AppError('Credenciales incorrectas.', 401);
    }

    const rolesSet = new Set<string>();
    const permisosSet = new Set<string>();

    user.asignacionesRoles.forEach((asig) => {
      if (asig.rol) {
        rolesSet.add(asig.rol.nombre);
        asig.rol.rolPermisos.forEach((rp) => {
          if (rp.permiso) permisosSet.add(rp.permiso.codigo);
        });
      }
    });

    const carrerasPlanas = await ScopeService.obtenerCarrerasAccesiblesPorUsuario(user.id);

    const asignacionConCarrera = user.asignacionesRoles.find((a) => a.carreraId);
    const asignacionConFacultad = user.asignacionesRoles.find((a) => a.facultadId);
    const jerarquia = ['Administrador', 'Decano', 'Vicedecano', 'Jefe de Laboratorios', 'Director de Carrera', 'Docente'];
    const rolPrincipal = jerarquia.find((r) => rolesSet.has(r)) || Array.from(rolesSet)[0] || '';

    const tokenPayload = {
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      username: user.username,
      correo: user.correo,
      esGlobal: user.esGlobal,
      rol: rolPrincipal,
      roles: Array.from(rolesSet),
      permisos: Array.from(permisosSet),
      carreras: carrerasPlanas,
      carreraId: asignacionConCarrera?.carreraId || (carrerasPlanas.length > 0 ? carrerasPlanas[0] : null),
      facultadId: asignacionConFacultad?.facultadId || null,
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET || 'syslab_secreto_super_seguro_uajms',
      { expiresIn: (process.env.JWT_EXPIRES_IN || '8h') as any }
    );

    return {
      token,
      usuario: {
        id: tokenPayload.id,
        nombre: tokenPayload.nombre,
        apellido: tokenPayload.apellido,
        username: tokenPayload.username,
        correo: tokenPayload.correo,
        esGlobal: tokenPayload.esGlobal,
        rol: tokenPayload.rol,
        roles: tokenPayload.roles,
        permisos: tokenPayload.permisos,
        carreraId: tokenPayload.carreraId,
        facultadId: tokenPayload.facultadId,
      },
    };
  }
}

export const authService = new AuthService();