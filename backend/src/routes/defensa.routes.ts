import { Router } from 'express';
import { verificarJWT } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/authorize.middleware.js';
import { defensaController } from '../controllers/defensa.controller.js';

const router = Router();
router.use(verificarJWT);

router.get('/', requirePermission('defensas:listar'), defensaController.listar);
router.get('/trabajos', requirePermission('defensas:listar'), defensaController.listar);
router.post('/trabajos', requirePermission('defensas:crear'), defensaController.crear);
router.get('/trabajos/:id', requirePermission('defensas:listar'), defensaController.obtenerPorId);
router.put('/trabajos/:id', requirePermission('defensas:editar'), defensaController.actualizar);
router.post('/trabajos/:id/tribunales', requirePermission('defensas:designar'), defensaController.asignarTribunales);
router.post('/trabajos/:id/versiones', requirePermission('defensas:crear'), defensaController.subirVersion);
router.post('/trabajos/:id/observaciones', requirePermission('defensas:observar'), defensaController.registrarObservacion);
router.post('/trabajos/:id/conformidad', requirePermission('defensas:observar'), defensaController.emitirConformidad);
router.get('/trabajos/:id/acta-pdf', requirePermission('defensas:acta'), defensaController.generarActaPdf);
router.get('/trabajos/:id/memorandums/:tribunalId/pdf', requirePermission('defensas:designar'), defensaController.generarMemorandumPdf);
router.get('/trabajos/:id/acta', requirePermission('defensas:acta'), defensaController.generarActa);

router.get('/:id', requirePermission('defensas:listar'), defensaController.obtenerPorId);
router.post('/', requirePermission('defensas:crear'), defensaController.crear);
router.put('/:id', requirePermission('defensas:editar'), defensaController.actualizar);
router.post('/:id/tribunales', requirePermission('defensas:designar'), defensaController.asignarTribunales);
router.post('/:id/versiones', requirePermission('defensas:crear'), defensaController.subirVersion);
router.post('/:id/observaciones', requirePermission('defensas:observar'), defensaController.registrarObservacion);
router.post('/:id/conformidad', requirePermission('defensas:observar'), defensaController.emitirConformidad);
router.post('/:id/acta', requirePermission('defensas:acta'), defensaController.generarActa);

export default router;
