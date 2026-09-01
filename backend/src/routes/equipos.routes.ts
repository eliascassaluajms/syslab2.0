import { Router } from 'express';
import { equipoController } from '../controllers/equipo.controller.js';
import { verificarJWT } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/authorize.middleware.js';

const router = Router();
router.use(verificarJWT);

router.get('/', requirePermission('equipos:listar'), equipoController.listar);
router.get('/:id', requirePermission('equipos:listar'), equipoController.obtenerPorId);
router.post('/', requirePermission('equipos:crear'), equipoController.crear);
router.put('/:id', requirePermission('equipos:editar'), equipoController.actualizar);
router.delete('/:id', requirePermission('equipos:eliminar'), equipoController.eliminar);

export default router;