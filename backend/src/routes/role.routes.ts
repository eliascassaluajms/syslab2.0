import { Router, Request, Response, NextFunction } from 'express';
import { verificarJWT } from '../middlewares/auth.middleware.js';
import { AppError } from '../utils/appError.js';
import {
  obtenerRoles,
  obtenerRolPorId,
  crearRol,
  actualizarRol,
  eliminarRol,
  obtenerPermisos,
} from '../controllers/role.controller.js';

const router = Router();

const exigirAdministrador = (req: Request, _res: Response, next: NextFunction) => {
  if (req.user?.rol !== 'Administrador') {
    return next(new AppError('Operación prohibida. Solo administradores pueden gestionar la matriz de roles.', 403));
  }
  next();
};

// Protección global del router
router.use(verificarJWT, exigirAdministrador);

// Catálogo de permisos
router.get('/permisos', obtenerPermisos);

// CRUD de Roles
router.get('/', obtenerRoles);
router.get('/:id', obtenerRolPorId);
router.post('/', crearRol);
router.put('/:id', actualizarRol);
router.delete('/:id', eliminarRol);

export default router;