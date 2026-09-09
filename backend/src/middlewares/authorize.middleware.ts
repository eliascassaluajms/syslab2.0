import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError.js';

/**
 * Middleware para requerir un permiso específico o cualquiera de una lista (KAN-16)
 * Valida stateless contra los permisos extraídos del Token JWT.
 * Incluye Bypass automático para SuperAdmin (esGlobal) o Rol 'Administrador'.
 */
export const requirePermission = (codigoPermiso: string | string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;

      if (!user) {
        throw new AppError('No autenticado. Token de acceso no válido o ausente.', 401);
      }

      // 🟢 Bypass absoluto: si es Global o si tiene el rol Administrador en su lista de roles
      if (user.esGlobal || (Array.isArray(user.roles) && user.roles.includes('Administrador'))) {
        return next();
      }

      // Verificar si el arreglo de permisos en el token contiene el o los permisos requeridos
      const permisosReq = Array.isArray(codigoPermiso) ? codigoPermiso : [codigoPermiso];
      const tienePermiso = Array.isArray(user.permisos) && permisosReq.some((cp) => user.permisos.includes(cp));

      if (!tienePermiso) {
        throw new AppError(
          `Acceso denegado. No posee los permisos requeridos (${permisosReq.join(' o ')}) para realizar esta acción.`,
          403
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const requireAdminRole = (req: Request, _res: Response, next: NextFunction) => {
  try {
    const user = (req as any).user;

    if (!user) {
      throw new AppError('No autenticado. Token de acceso no válido o ausente.', 401);
    }

    if (user.esGlobal || (Array.isArray(user.roles) && user.roles.includes('Administrador'))) {
      return next();
    }

    throw new AppError('Acceso denegado. Solo el rol Administrador puede restablecer contraseñas.', 403);
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware Polimórfico de Control Perimetral (KAN-16 & KAN-16.2)
 * Inspecciona req.params, req.body o req.query buscando el ID de ámbito
 * y valida contra las carreras permitidas en el Token JWT.
 * Incluye Bypass automático para SuperAdmin (esGlobal) o Rol 'Administrador'.
 */
export const verificarAmbitoCarrera = (paramKey: string = 'carreraId') => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;

      if (!user) {
        throw new AppError('Error de infraestructura: Contexto de seguridad no inicializado.', 500);
      }

      // 🟢 Bypass de ámbito perimetral para SuperAdmin o Administrador
      if (user.esGlobal || (Array.isArray(user.roles) && user.roles.includes('Administrador'))) {
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

      const tieneAcceso = Array.isArray(user.carreras) && user.carreras.includes(targetCarreraId);

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

/**
 * Middleware para restringir el acceso a roles específicos
 */
export const restrictTo = (...rolesPermitidos: string[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const user = (req as any).user;

      if (!user) {
        throw new AppError('No autenticado. Token de acceso no válido o ausente.', 401);
      }

      // Bypass para superusuarios / globales / administradores
      if (
        user.esGlobal ||
        (Array.isArray(user.roles) && user.roles.includes('Administrador')) ||
        user.rol === 'Administrador' ||
        user.rol === 'SuperAdmin'
      ) {
        return next();
      }

      const rol = user.rol || '';
      const roles: string[] = Array.isArray(user.roles) ? user.roles : (rol ? [rol] : []);

      const tieneRol = rolesPermitidos.some(
        (r) => roles.includes(r) || rol === r
      );

      if (!tieneRol) {
        throw new AppError('No cuenta con los permisos necesarios para realizar esta acción.', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};