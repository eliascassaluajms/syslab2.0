import { Router } from 'express';
import multer from 'multer';
import { horarioController } from '../controllers/horario.controller.js';
import { verificarJWT } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/authorize.middleware.js';

const router = Router();
const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 10 * 1024 * 1024 },
});

router.use(verificarJWT);

router.get('/', requirePermission('horarios:listar'), horarioController.listar);
router.get('/disponibilidad', requirePermission('horarios:listar'), horarioController.obtenerDisponibilidad);
router.post('/importar-excel', requirePermission('horarios:crear'), upload.single('archivoExcel'), horarioController.importarExcel);
router.get('/:id', requirePermission('horarios:ver'), horarioController.obtenerPorId);
router.post('/', requirePermission('horarios:crear'), horarioController.crear);
router.put('/:id', requirePermission('horarios:editar'), horarioController.actualizar);
router.delete('/:id', requirePermission('horarios:eliminar'), horarioController.eliminar);

export default router;
