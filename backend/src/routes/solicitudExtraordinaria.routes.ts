import { Router } from 'express';
import { solicitudExtraordinariaController } from '../controllers/solicitudExtraordinaria.controller.js';
import { verificarJWT } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/authorize.middleware.js';

const router = Router();

router.use(verificarJWT);

router.post('/', requirePermission('solicitudes:crear'), solicitudExtraordinariaController.crear);
router.get('/', requirePermission('solicitudes:listar'), solicitudExtraordinariaController.listar);
router.patch('/:id/estado', requirePermission('solicitudes:aprobar'), solicitudExtraordinariaController.actualizarEstado);

export default router;
