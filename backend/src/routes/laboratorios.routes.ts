import { Router } from 'express';
import { verificarJWT } from '../middlewares/auth.middleware.js';
import { 
  requirePermission, 
  verificarAmbitoCarrera 
} from '../middlewares/authorize.middleware.js';
import {
  obtenerLaboratorios,
  crearLaboratorio,
  actualizarLaboratorio,
  cambiarEstadoLaboratorio,
} from '../controllers/laboratorios.controller.js';

const router = Router();

// Proteger todas las rutas del módulo con verificación de sesión JWT
router.use(verificarJWT);

// GET /api/laboratorios - Listar laboratorios
router.get(
  '/',
  requirePermission('laboratorios:listar'),
  obtenerLaboratorios
);

// POST /api/laboratorios - Crear laboratorio (valida permiso y perímetro de carrera si se especifica)
router.post(
  '/',
  requirePermission('laboratorios:crear'),
  verificarAmbitoCarrera('carreraId'),
  crearLaboratorio
);

// PUT /api/laboratorios/:id - Actualizar laboratorio
router.put(
  '/:id',
  requirePermission('laboratorios:editar'),
  verificarAmbitoCarrera('carreraId'),
  actualizarLaboratorio
);

// PATCH /api/laboratorios/:id/estado - Cambiar estado / Desactivar
router.patch(
  '/:id/estado',
  requirePermission('laboratorios:eliminar'),
  cambiarEstadoLaboratorio
);

export default router;