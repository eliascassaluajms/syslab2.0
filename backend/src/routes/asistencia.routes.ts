import { Router } from 'express';
import { asistenciaController } from '../controllers/asistencia.controller.js';
import { verificarJWT } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/authorize.middleware.js';

const router = Router();

// --- RUTA PÚBLICA PARA MARCADO DESDE EL QR ---
router.post('/registrar', asistenciaController.registrar);

// A partir de aquí, todo requiere autenticación JWT
router.use(verificarJWT);

// Consultas y nóminas de asistencia
router.get(
  '/sesion/:sesionId',
  requirePermission('bitacora:consultar'),
  asistenciaController.listarPorSesion
);
router.get(
  '/sesion/:sesionId/consolidada',
  requirePermission('bitacora:consultar'),
  asistenciaController.obtenerListaConsolidada
);

// Gestión manual y confirmación docente
router.put(
  '/sesion/:sesionId/estudiante/:estudianteId',
  requirePermission('bitacora:finalizar'),
  asistenciaController.actualizar
);
router.post(
  '/sesion/:sesionId/confirmar',
  requirePermission('bitacora:finalizar'),
  asistenciaController.confirmar
);

export default router;
