import { Router, Request, Response, NextFunction } from 'express';
import { verificarJWT } from '../middlewares/auth.middleware.js';
import { 
  obtenerUsuarios, 
  modificarUsuarioYPerimetros, 
  cambiarEstadoUsuario 
} from '../controllers/user.controller.js';
import { AppError } from '../utils/appError.js';

const router = Router();

/**
 * Middleware local: Garantiza acceso exclusivo a Administradores Centrales
 */
const exigirAdministrador = (req: Request, _res: Response, next: NextFunction) => {
  if (req.user?.rol !== 'Administrador') {
    return next(new AppError('Operación prohibida. Solo la administración central puede gestionar el ABM de usuarios.', 403));
  }
  next();
};

// Protecciones globales del router
router.use(verificarJWT, exigirAdministrador);

// Endpoints ABM de Personal (KAN-17)
router.get('/', obtenerUsuarios);
router.put('/:id', modificarUsuarioYPerimetros);
router.patch('/:id/estado', cambiarEstadoUsuario);

export default router;