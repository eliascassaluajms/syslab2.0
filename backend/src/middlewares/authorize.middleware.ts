import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError.js';

/**
 * Middleware para requerir un permiso específico (KAN-16)
 * Valida stateless contra los permisos extraídos del Token JWT.
 * Incluye Bypass automático para el rol Administrador.
 */
export const requirePermission = (codigoPermiso: string) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;

      if (!user) {
        throw new AppError('No autenticado. Token de acceso no válido o ausente.', 401);
      }

      // 🟢 Bypass absoluto para el Administrador
      if (user.rol === 'Administrador' || user.role === 'Administrador') {
        return next();
      }

      // Verificar si el arreglo de permisos en el token contiene el permiso requerido
      const tienePermiso = Array.isArray(user.permisos) && user.permisos.includes(codigoPermiso);

      if (!tienePermiso) {
        throw new AppError(
          `Acceso denegado. No posee el permiso '${codigoPermiso}' para realizar esta acción.`,
          403
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware Polimórfico de Control Perimetral (KAN-16 & KAN-16.2)
 * Inspecciona req.params, req.body o req.query buscando el ID de ámbito
 * y valida contra las carreras permitidas en el Token JWT.
 * Incluye Bypass automático para el rol Administrador.
 */
export const verificarAmbitoCarrera = (paramKey: string = 'carreraId') => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;

      if (!user) {
        throw new AppError('Error de infraestructura: Contexto de seguridad no inicializado.', 500);
      }

      // 🟢 Bypass de ámbito perimetral para el Administrador
      if (user.rol === 'Administrador' || user.role === 'Administrador') {
        return next();
      }

      // Si el usuario no tiene carreras asignadas, se asume ámbito global
      if (!user.carreras || user.carreras.length === 0) {
        return next();
      }

      // Inspección Polimórfica: Params -> Body -> Query
      const rawValue =
        req.params[paramKey] ||
        req.params.id ||
        req.body[paramKey] ||
        req.body.id ||
        req.query[paramKey] ||
        req.query.id;

      if (!rawValue) {
        throw new AppError(
          `Control perimetral rechazado: No se detectó el parámetro de ámbito '${paramKey}' en la petición.`,
          400
        );
      }

      const targetCarreraId = Number(rawValue);

      if (isNaN(targetCarreraId)) {
        throw new AppError('El identificador de ámbito debe ser un número entero válido.', 400);
      }

      const tieneAcceso = user.carreras.includes(targetCarreraId);

      if (!tieneAcceso) {
        throw new AppError(
          'Acceso denegado (403): Su perímetro asignado no le permite operar sobre esta unidad o carrera.',
          403
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};