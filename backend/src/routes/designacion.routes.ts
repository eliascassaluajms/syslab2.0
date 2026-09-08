import { Router } from 'express';
import { DesignacionController } from '../controllers/designacion.controller.js';
import { verificarJWT } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/authorize.middleware.js';

const router = Router();

router.use(verificarJWT);

router.post('/', requirePermission('designaciones:crear'), DesignacionController.crear);
router.get('/', requirePermission('designaciones:listar'), DesignacionController.listar);
router.delete('/:id', requirePermission('designaciones:eliminar'), DesignacionController.eliminar);

export default router;
