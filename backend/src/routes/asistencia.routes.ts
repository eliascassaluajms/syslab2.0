import { Router } from 'express';
import { asistenciaController } from '../controllers/asistencia.controller.js';
import { verificarJWT } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/authorize.middleware.js';

const router = Router();

router.use(verificarJWT);
router.post('/registrar', asistenciaController.registrar);

router.get('/sesion/:sesionId', requirePermission('bitacora:consultar'), asistenciaController.listarPorSesion);

export default router;
