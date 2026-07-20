import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError.js';

/**
 * KAN-16 & KAN-16.2: Middleware de Inspección Polimórfica y Validación Perimetral de Ámbito
 * Inspecciona dinámicamente req.params, req.body o req.query buscando el ID de ámbito
 * y verifica que exista dentro del arreglo de carreras asignadas en el JWT.
 */
export const verificarAmbitoCarrera = (paramKey: string = 'carreraId') => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const user = req.user;

      if (!user) {
        throw new AppError('Usuario no autenticado.', 401);
      }

      // 1. Bypass para el Administrador Central (Acceso global garantizado)
      if (user.rol === 'Administrador') {
        return next();
      }

      // 2. 🔥 Inspección Polimórfica (KAN-16.2): Params -> Body -> Query
      const rawValue =
        req.params[paramKey] ||
        req.params.id ||
        req.body[paramKey] ||
        req.body.id ||
        req.query[paramKey] ||
        req.query.id;

      if (!rawValue) {
        throw new AppError(
          `Parámetro de ámbito '${paramKey}' o 'id' no detectado en la petición.`,
          400
        );
      }

      const targetCarreraId = Number(rawValue);

      if (isNaN(targetCarreraId)) {
        throw new AppError('El identificador de ámbito debe ser un valor numérico válido.', 400);
      }

      // 3. Validación contra la matriz perimetral resuelta en el Token JWT (KAN-16)
      const tieneAcceso = Array.isArray(user.carreras) && user.carreras.includes(targetCarreraId);

      if (!tieneAcceso) {
        throw new AppError(
          'Acceso denegado (403): No posee permisos sobre la carrera o unidad seleccionada.',
          403
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};