import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/appError.js';

export const verificarJWT = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      throw new AppError('No has iniciado sesión. Por favor, proporciona un token válido.', 401);
    }

    let decoded: any;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'syslab_secreto_super_seguro_uajms'
      );
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new AppError('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.', 401);
      }
      throw new AppError('Token inválido o corrupto. Acceso denegado.', 401);
    }

    // Validación de la cuenta en base de datos con asignaciones de ámbito
    const usuarioDb = await prisma.usuario.findUnique({
      where: { id: Number(decoded.id) },
      select: {
        id: true,
        activo: true,
        rol: { select: { nombre: true } },
        asignacionesRoles: {
          select: {
            rol: { select: { nombre: true } },
            carreraId: true,
            facultadId: true,
          },
        },
      },
    });

    if (!usuarioDb || !usuarioDb.activo) {
      throw new AppError('Acceso denegado. La cuenta no existe o ha sido desactivada.', 401);
    }

    const asigConCarrera = usuarioDb.asignacionesRoles.find((a) => a.carreraId);
    const asigConFacultad = usuarioDb.asignacionesRoles.find((a) => a.facultadId);
    const rolesToken = Array.isArray(decoded.roles) ? decoded.roles : (decoded.rol ? [decoded.rol] : []);
    const rolesDb = usuarioDb.asignacionesRoles
      .map((a) => a.rol?.nombre)
      .filter((r): r is string => Boolean(r));
    if (usuarioDb.rol?.nombre && !rolesDb.includes(usuarioDb.rol.nombre)) {
      rolesDb.unshift(usuarioDb.rol.nombre);
    }
    const rolesFinales = rolesToken.length > 0 ? rolesToken : rolesDb;

    const jerarquia = ['Administrador', 'Decano', 'Vicedecano', 'Jefe de Laboratorios', 'Director de Carrera', 'Docente'];
    const rolPrincipal = decoded.rol || jerarquia.find((r) => rolesFinales.includes(r)) || rolesFinales[0] || '';

    const carrerasToken = Array.isArray(decoded.carreras) ? decoded.carreras : [];
    const carreraIdFinal = decoded.carreraId 
      ? Number(decoded.carreraId) 
      : (asigConCarrera?.carreraId ?? (carrerasToken.length > 0 ? Number(carrerasToken[0]) : undefined));
    const facultadIdFinal = decoded.facultadId 
      ? Number(decoded.facultadId) 
      : (asigConFacultad?.facultadId ?? undefined);

    // Inyección contextual limpia
    (req as any).user = {
      id: Number(decoded.id),
      nombre: String(decoded.nombre),
      correo: String(decoded.correo),
      esGlobal: Boolean(decoded.esGlobal),
      rol: rolPrincipal,
      roles: rolesFinales,
      permisos: decoded.permisos || [],
      carreras: carrerasToken,
      carreraId: carreraIdFinal,
      facultadId: facultadIdFinal,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export const protect = verificarJWT;
export { restrictTo } from './authorize.middleware.js';