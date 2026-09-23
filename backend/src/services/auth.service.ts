import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/appError.js';
import { ScopeService } from './scope.service.js';
import { IAuthResponse, IJwtPayload } from '../interfaces/auth.interface.js';

function obtenerJwtSecret(): string {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret || jwtSecret.trim() === '') {
    throw new AppError('Configuración incompleta del servidor: falta la variable de entorno JWT_SECRET.', 500);
  }
  return jwtSecret;
}

function hashearToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

const ROLES_DOCENTES_EXIGIDOS = [
  'Docente',
  'Director de Carrera',
  'Decano',
  'Vicedecano',
  'Jefe de Laboratorios',
];

const REFRESH_TOKEN_EXPIRES_DAYS = 30;

export class AuthService {
  private async construirTokenPayloadYFirmar(user: any) {
    const rolesSet = new Set<string>();
    const permisosSet = new Set<string>();

    if (Array.isArray(user.asignacionesRoles)) {
      user.asignacionesRoles.forEach((asig: any) => {
        if (asig.rol) {
          rolesSet.add(asig.rol.nombre);
          if (Array.isArray(asig.rol.rolPermisos)) {
            asig.rol.rolPermisos.forEach((rp: any) => {
              if (rp.permiso) permisosSet.add(rp.permiso.codigo);
            });
          }
        }
      });
    }

    if (user.rol?.nombre) {
      rolesSet.add(user.rol.nombre);
    }

    const carrerasPlanas = await ScopeService.obtenerCarrerasAccesiblesPorUsuario(user.id);
    const asignacionConCarrera = user.asignacionesRoles?.find((a: any) => a.carreraId);
    const asignacionConFacultad = user.asignacionesRoles?.find((a: any) => a.facultadId);
    const jerarquia = ['Administrador', 'Decano', 'Vicedecano', 'Jefe de Laboratorios', 'Director de Carrera', 'Docente'];
    const rolPrincipal = jerarquia.find((r) => rolesSet.has(r)) || Array.from(rolesSet)[0] || '';

    const tokenPayload: IJwtPayload = {
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
      obtenerJwtSecret(),
      { expiresIn: (process.env.JWT_EXPIRES_IN || '8h') as jwt.SignOptions['expiresIn'] }
    );

    return { token, tokenPayload, rolesSet };
  }

  private async emitirRefreshToken(usuarioId: number, dispositivoInfo?: string): Promise<{ rawRefreshToken: string; tokenHash: string; expiraEn: Date }> {
    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = hashearToken(rawRefreshToken);
    const dias = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS) || REFRESH_TOKEN_EXPIRES_DAYS;
    const expiraEn = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);

    await prisma.refreshToken.create({
      data: {
        tokenHash,
        usuarioId,
        dispositivoInfo: dispositivoInfo ?? null,
        expiraEn,
      },
    });

    return { rawRefreshToken, tokenHash, expiraEn };
  }

  async login(
    identificador: string,
    passwordPlain: string,
    opciones: { exigirRolesDocentes?: boolean; dispositivoInfo?: string } = {}
  ): Promise<IAuthResponse> {
    const term = identificador.trim().toLowerCase();
    const user = await prisma.usuario.findFirst({
      where: {
        OR: [
          { correo: term },
          { username: term },
        ]
      },
      include: {
        rol: { select: { nombre: true } },
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

    const { token, tokenPayload, rolesSet } = await this.construirTokenPayloadYFirmar(user);

    if (opciones.exigirRolesDocentes) {
      const esDocente =
        user.esGlobal ||
        rolesSet.has('Administrador') ||
        ROLES_DOCENTES_EXIGIDOS.some((r) => rolesSet.has(r));
      if (!esDocente) {
        throw new AppError(
          'Esta aplicación es exclusiva para el personal docente. Si usted es estudiante, utilice la aplicación de estudiantes.',
          403
        );
      }
    }

    const { rawRefreshToken } = await this.emitirRefreshToken(user.id, opciones.dispositivoInfo);

    return {
      token,
      refreshToken: rawRefreshToken,
      usuario: {
        id: tokenPayload.id,
        nombre: tokenPayload.nombre,
        apellido: tokenPayload.apellido || '',
        username: tokenPayload.username || '',
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

  async refrescarToken(refreshTokenStr: string, dispositivoInfo?: string): Promise<IAuthResponse> {
    if (!refreshTokenStr || typeof refreshTokenStr !== 'string') {
      throw new AppError('Token de actualización no proporcionado.', 400);
    }

    const tokenHash = hashearToken(refreshTokenStr.trim());
    const tokenRecord = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        usuario: {
          include: {
            rol: { select: { nombre: true } },
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
        },
      },
    });

    if (!tokenRecord) {
      throw new AppError('Token de actualización inválido o no reconocido.', 401);
    }

    // 🔒 DETECCIÓN DE REUSO (Token Theft Detection):
    // Si un token revocado intenta usarse de nuevo, invalidamos todos los refresh tokens del usuario.
    if (tokenRecord.revocado) {
      await prisma.refreshToken.updateMany({
        where: { usuarioId: tokenRecord.usuarioId, revocado: false },
        data: { revocado: true, revocadoEn: new Date() },
      });
      throw new AppError('Violación de seguridad detectada: reuso de credenciales. La sesión ha sido revocada.', 401);
    }

    // Verificar si expiró
    if (tokenRecord.expiraEn < new Date()) {
      await prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: { revocado: true, revocadoEn: new Date() },
      });
      throw new AppError('El token de actualización ha expirado. Por favor, inicie sesión nuevamente.', 401);
    }

    if (!tokenRecord.usuario || !tokenRecord.usuario.activo) {
      throw new AppError('Acceso denegado. La cuenta de usuario asociada está inactiva o no existe.', 401);
    }

    // 🔄 ROTACIÓN DE TOKEN:
    const rawNuevoRefreshToken = crypto.randomBytes(40).toString('hex');
    const nuevoTokenHash = hashearToken(rawNuevoRefreshToken);
    const dias = Number(process.env.REFRESH_TOKEN_EXPIRES_DAYS) || REFRESH_TOKEN_EXPIRES_DAYS;
    const expiraEn = new Date(Date.now() + dias * 24 * 60 * 60 * 1000);

    await prisma.$transaction([
      prisma.refreshToken.update({
        where: { id: tokenRecord.id },
        data: {
          revocado: true,
          revocadoEn: new Date(),
          reemplazadoPorHash: nuevoTokenHash,
        },
      }),
      prisma.refreshToken.create({
        data: {
          tokenHash: nuevoTokenHash,
          usuarioId: tokenRecord.usuarioId,
          dispositivoInfo: dispositivoInfo ?? tokenRecord.dispositivoInfo,
          expiraEn,
        },
      }),
    ]);

    const { token, tokenPayload } = await this.construirTokenPayloadYFirmar(tokenRecord.usuario);

    return {
      token,
      refreshToken: rawNuevoRefreshToken,
      usuario: {
        id: tokenPayload.id,
        nombre: tokenPayload.nombre,
        apellido: tokenPayload.apellido || '',
        username: tokenPayload.username || '',
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

  async logout(refreshTokenStr?: string): Promise<void> {
    if (!refreshTokenStr) return;
    const tokenHash = hashearToken(refreshTokenStr.trim());
    await prisma.refreshToken.updateMany({
      where: { tokenHash, revocado: false },
      data: { revocado: true, revocadoEn: new Date() },
    });
  }
}

export const authService = new AuthService();