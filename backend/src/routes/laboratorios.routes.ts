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
  obtenerEstadoLaboratoriosReal, // 🟢 1. Importar la función de tiempo real
  obtenerMisHorariosActivos,
  obtenerMisReservasAprobadasHoy,
} from '../controllers/laboratorios.controller.js';

const router = Router();

// Proteger todas las rutas del módulo con verificación de sesión JWT
router.use(verificarJWT);

router.get('/mis-horarios-activos', requirePermission('bitacora:iniciar'), obtenerMisHorariosActivos);
router.get('/mis-reservas-aprobadas-hoy', requirePermission('bitacora:iniciar'), obtenerMisReservasAprobadasHoy);

// GET /api/laboratorios/estado-actual - Estado en tiempo real (DEBE IR ANTES de /:id)
router.get(
  '/estado-actual',
  requirePermission('laboratorios:ver_estado'), // 🟢 2. Proteger con el permiso maestro inyectado en el seed
  obtenerEstadoLaboratoriosReal
);

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