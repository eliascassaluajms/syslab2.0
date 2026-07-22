import { Router } from 'express';
import { verificarJWT } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/authorize.middleware.js';
import { 
  obtenerUsuarios, 
  crearUsuarioBasico,
  modificarUsuarioYPerimetros, 
  cambiarEstadoUsuario 
} from '../controllers/user.controller.js';

const router = Router();

// Proteger todas las rutas con verificación de sesión JWT
router.use(verificarJWT);

// Endpoints ABM de Personal con permisos dinámicos
// GET /api/usuarios
router.get(
  '/', 
  requirePermission('usuarios:listar'), 
  obtenerUsuarios
);

// POST /api/usuarios
router.post(
  '/', 
  requirePermission('usuarios:crear'), 
  crearUsuarioBasico
);

// PUT /api/usuarios/:id
router.put(
  '/:id', 
  requirePermission('usuarios:editar'), 
  modificarUsuarioYPerimetros
);

// PATCH /api/usuarios/:id/estado
router.patch(
  '/:id/estado', 
  requirePermission('usuarios:editar'), 
  cambiarEstadoUsuario
);

export default router;