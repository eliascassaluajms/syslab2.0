import { Router, Request, Response, NextFunction } from 'express';
import { verificarJWT } from '../middlewares/auth.middleware.js';
import { 
  obtenerUsuarios, 
  crearUsuarioBasico,
  modificarUsuarioYPerimetros, 
  cambiarEstadoUsuario 
} from '../controllers/user.controller.js';
import { AppError } from '../utils/appError.js';

const router = Router();

/**
 * Middleware local: Garantiza acceso exclusivo a Administradores Centrales.
 * Soporta evaluación de rol único (legacy) y múltiples roles simultáneos.
 */
const exigirAdministrador = (req: Request, _res: Response, next: NextFunction) => {
  const user = req.user as any;
  let tieneRolAdmin = false;

  if (Array.isArray(user?.roles)) {
    tieneRolAdmin = user.roles.some((r: any) => 
      typeof r === 'string' ? r === 'Administrador' : r?.nombre === 'Administrador'
    );
  } else if (typeof user?.rol === 'string') {
    tieneRolAdmin = user.rol === 'Administrador';
  } else if (user?.rol?.nombre) {
    tieneRolAdmin = user.rol.nombre === 'Administrador';
  }

  if (!tieneRolAdmin) {
    return next(new AppError('Operación prohibida. Solo la administración central puede gestionar el ABM de usuarios.', 403));
  }
  next();
};

// Protecciones globales del router (requiere token JWT y rol de Administrador)
router.use(verificarJWT, exigirAdministrador);

// Endpoints ABM de Personal (KAN-17)
router.get('/', obtenerUsuarios);
router.post('/', crearUsuarioBasico); // Permite atender el botón "Registrar Nuevo Usuario" (POST /api/usuarios)
router.put('/:id', modificarUsuarioYPerimetros);
router.patch('/:id/estado', cambiarEstadoUsuario);

export default router;