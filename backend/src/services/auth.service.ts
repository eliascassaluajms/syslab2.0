import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/appError.js';
import { ScopeService } from './scope.service.js';

export class AuthService {
  async login(correo: string, passwordPlain: string) {
    const user = await prisma.usuario.findUnique({
      where: { correo },
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

    const tokenPayload = {
      id: user.id,
      nombre: user.nombre,
      correo: user.correo,
      esGlobal: user.esGlobal,
      roles: Array.from(rolesSet),
      permisos: Array.from(permisosSet),
      carreras: carrerasPlanas,
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
        correo: tokenPayload.correo,
        esGlobal: tokenPayload.esGlobal,
        roles: tokenPayload.roles,
        permisos: tokenPayload.permisos,
      },
    };
  }
}

export const authService = new AuthService();