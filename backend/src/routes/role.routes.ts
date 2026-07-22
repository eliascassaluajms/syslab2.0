import { Router } from 'express';
import { verificarJWT } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/authorize.middleware.js';
import {
  obtenerRoles,
  obtenerRolPorId,
  crearRol,
  actualizarRol,
  eliminarRol,
  obtenerPermisos,
} from '../controllers/role.controller.js';

const router = Router();

// Proteger todas las rutas del módulo con JWT
router.use(verificarJWT);

// Catálogo de permisos (necesario para construir la matriz al crear/editar roles)
router.get(
  '/permisos',
  requirePermission('roles:listar'),
  obtenerPermisos
);

// CRUD de Roles con permisos granulares
// GET /api/roles
router.get(
  '/',
  requirePermission('roles:listar'),
  obtenerRoles
);

// GET /api/roles/:id
router.get(
  '/:id',
  requirePermission('roles:listar'),
  obtenerRolPorId
);

// POST /api/roles
router.post(
  '/',
  requirePermission('roles:crear'),
  crearRol
);

// PUT /api/roles/:id
router.put(
  '/:id',
  requirePermission('roles:editar'),
  actualizarRol
);

// DELETE /api/roles/:id
router.delete(
  '/:id',
  requirePermission('roles:eliminar'),
  eliminarRol
);

export default router;