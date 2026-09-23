import { Router } from 'express';
import { incidenciaController } from '../controllers/incidencia.controller.js';
import { verificarJWT } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/authorize.middleware.js';
import { subirEvidenciaIncidencia } from '../middlewares/incidencia.upload.middleware.js';

const router = Router();
router.use(verificarJWT);

// El orden importa: /mis-reportes debe ir antes de /:id
router.get('/mis-reportes', requirePermission('fallas:crear'), incidenciaController.listarMisReportes);
router.get('/', requirePermission('fallas:listar'), incidenciaController.listar);
router.get('/:id', requirePermission('fallas:listar'), incidenciaController.obtenerPorId);
router.post('/', requirePermission('fallas:crear'), incidenciaController.crear);
router.post('/:id/notas', requirePermission('fallas:listar'), incidenciaController.agregarNota);
router.post(
  '/:id/evidencia',
  requirePermission('fallas:listar'),
  subirEvidenciaIncidencia.single('evidencia'),
  incidenciaController.subirEvidencia,
);
router.patch('/:id/gestionar', requirePermission('fallas:editar'), incidenciaController.gestionar);

export default router;