import { Router } from 'express';
import { verificarJWT } from '../middlewares/auth.middleware.js';
import { 
  obtenerUsuarios, 
  modificarUsuarioYPerimetros, 
  cambiarEstadoUsuario 
} from '../controllers/user.controller.js';
import { AppError } from '../utils/appError.js';

const router = Router();

// Restricción administrativa estricta para el ABM
const exigirAdministrador = (req: any, res: any, next: any) => {
  if (req.user?.rol !== 'Administrador') {
    return next(new AppError('Operación prohibida. Solo la administración central puede gestionar el ABM de usuarios.', 403));
  }
  next();
};

// Rutas protegidas jerárquicamente
router.use(verificarJWT, exigirAdministrador);

router.get('/', obtenerUsuarios);
router.put('/:id', modificarUsuarioYPerimetros);
router.patch('/:id/estado', cambiarEstadoUsuario);

export default router;