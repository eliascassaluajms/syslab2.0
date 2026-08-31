import { Router } from 'express';
import { horarioController } from '../controllers/horario.controller.js';
import { verificarJWT } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/authorize.middleware.js';

const router = Router();

router.use(verificarJWT);

router.get('/', requirePermission('horarios:listar'), horarioController.listar);
router.get('/:id', requirePermission('horarios:ver'), horarioController.obtenerPorId);
router.post('/', requirePermission('horarios:crear'), horarioController.crear);
router.put('/:id', requirePermission('horarios:editar'), horarioController.actualizar);
router.delete('/:id', requirePermission('horarios:eliminar'), horarioController.eliminar);

export default router;
