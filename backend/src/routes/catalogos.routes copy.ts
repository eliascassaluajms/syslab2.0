import { Router } from 'express';
import { verificarJWT } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/authorize.middleware.js';
import {
  obtenerFacultades,
  crearFacultad,
  obtenerCarreras,
  crearCarrera,
} from '../controllers/catalogos.controller.js';

const router = Router();

// Proteger todas las rutas del módulo con verificación de sesión JWT
router.use(verificarJWT);

// ==========================================
// RUTAS DE FACULTADES
// ==========================================

// GET /api/catalogos/facultades
router.get(
  '/facultades',
  requirePermission('facultades:listar'),
  obtenerFacultades
);

// POST /api/catalogos/facultades
router.post(
  '/facultades',
  requirePermission('facultades:crear'),
  crearFacultad
);

// ==========================================
// RUTAS DE CARRERAS
// ==========================================

// GET /api/catalogos/carreras
router.get(
  '/carreras',
  requirePermission('carreras:listar'),
  obtenerCarreras
);

// POST /api/catalogos/carreras
router.post(
  '/carreras',
  requirePermission('carreras:crear'),
  crearCarrera
);

export default router;