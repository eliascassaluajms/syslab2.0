import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/appError.js';
import { userRepository } from '../repositories/user.repository.js';
import { IJwtPayload } from '../interfaces/auth.interface.js';

/**
 * 1. Validación e Intercepción de Sesión (KAN-15)
 */
export const verificarJWT = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let token: string | undefined;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      throw new AppError('No has iniciado sesión. Por favor, proporciona un token válido.', 401);
    }

    let decoded: any; // Usamos un tipado dinámico intermedio aquí para mitigar el bloqueo ts(2322)
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

    // Validación en tiempo real del ciclo de vida inmediato (KAN-15.1)
    const usuarioDb = await userRepository.findById(Number(decoded.id));

    if (!usuarioDb) {
      throw new AppError('El usuario asociado a este token ya no existe en el sistema.', 401);
    }

    if (!usuarioDb.activo) {
      throw new AppError('Acceso denegado. Esta cuenta ha sido desactivada.', 401);
    }

    // 4. Inyectar el contexto de seguridad en la petición (Stateless Context)
    (req as any).user = {
      id: Number(decoded.id),
      nombre: String(decoded.nombre),
      correo: String(decoded.correo),
      rol: String(decoded.rol),
      permisos: decoded.permisos,
      carreras: decoded.carreras
    };

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 2. Middleware de Inspección Polimórfica (KAN-16.2)
 * Extrae, sanitiza y centraliza el ID objetivo de la carrera en la petición.
 */
export const inspeccionarParametros = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const carreraIdRaw = req.params.carreraId || req.body.carreraId || req.query.carreraId;

    if (!carreraIdRaw) {
      throw new AppError('Control perimetral rechazado: No se detectó ningún identificador de carrera en la petición.', 400);
    }

    const targetId = parseInt(carreraIdRaw as string, 10);
    if (isNaN(targetId)) {
      throw new AppError('El identificador de la carrera debe ser un número entero válido.', 400);
    }

    req.targetCarreraId = targetId;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * 3. Middleware Especializado de Control Perimetral (KAN-16)
 * Valida de forma puramente stateless el acceso basándose en req.targetCarreraId
 */
export const verificarAmbitoCarrera = (req: Request, res: Response, next: NextFunction): void => {
  try {
    if (!req.user) {
      throw new AppError('Error de infraestructura: Contexto de seguridad no inicializado.', 500);
    }

    // Bypass automático para roles de gestión global (Uajms Root)
    if (req.user.rol === 'Administrador' || req.user.rol === 'Jefe de Laboratorios') {
      return next();
    }

    if (!req.targetCarreraId) {
      throw new AppError('Error de infraestructura: El identificador perimetral no ha sido inspeccionado.', 500);
    }

    const tieneAcceso = req.user.carreras.includes(req.targetCarreraId);

    if (!tieneAcceso) {
      throw new AppError('Acceso denegado. Su perímetro asignado no le permite operar en esta carrera.', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
  
};