import { Router } from 'express';
import { incidenciaController } from '../controllers/incidencia.controller.js';
import { verificarJWT } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/authorize.middleware.js';

const router = Router();
router.use(verificarJWT);

router.get('/', requirePermission('fallas:listar'), incidenciaController.listar);
router.post('/', requirePermission('fallas:crear'), incidenciaController.crear);
router.patch('/:id/gestionar', requirePermission('fallas:editar'), incidenciaController.gestionar);

export default router;