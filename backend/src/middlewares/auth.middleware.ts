import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/appError.js';
import { userRepository } from '../repositories/user.repository.js';

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

    // Validación en tiempo real del estado de la cuenta en base de datos
    const usuarioDb = await userRepository.findById(Number(decoded.id));

    if (!usuarioDb || !usuarioDb.activo) {
      throw new AppError('Acceso denegado. La cuenta no existe o ha sido desactivada.', 401);
    }

    // Inyección segura del contexto de usuario (mitiga conflictos ts(2322))
    (req as any).user = {
      id: Number(decoded.id),
      nombre: String(decoded.nombre),
      correo: String(decoded.correo),
      rol: String(decoded.rol),
      permisos: decoded.permisos || [],
      carreras: decoded.carreras || []
    };

    next();
  } catch (error) {
    next(error);
  }
};