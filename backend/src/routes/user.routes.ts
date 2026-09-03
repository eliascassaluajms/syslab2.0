import { Router } from 'express';
import { verificarJWT } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/authorize.middleware.js';
import { 
  obtenerUsuarios, 
  crearUsuarioBasico,
  modificarUsuarioYPerimetros, 
  cambiarEstadoUsuario,
  cambiarPasswordUsuario,
  cambiarPasswordPersonal,
  obtenerEstudiantesPublico
} from '../controllers/user.controller.js';

const router = Router();

// Endpoint público para obtener listado de estudiantes en selector QR
router.get('/estudiantes', obtenerEstudiantesPublico);

// Proteger todas las rutas posteriores con verificación de sesión JWT
router.use(verificarJWT);

// PATCH /api/usuarios/perfil/password (Permite a cualquier usuario cambiar su propia contraseña)
router.patch('/perfil/password', cambiarPasswordPersonal);

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

// PATCH /api/usuarios/:id/password
router.patch(
  '/:id/password',
  requirePermission('usuarios:editar'),
  cambiarPasswordUsuario
);

export default router;