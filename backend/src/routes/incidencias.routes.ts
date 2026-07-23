import { Router } from 'express';
import { verificarJWT } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/authorize.middleware.js';
import {
  obtenerIncidencias,
  reportarIncidencia,
  actualizarEstadoIncidencia,
} from '../controllers/incidencias.controller.js';

const router = Router();

router.use(verificarJWT);

router.get('/', requirePermission('incidencias:listar'), obtenerIncidencias);
router.post('/', requirePermission('incidencias:reportar'), reportarIncidencia);
router.patch('/:id/estado', requirePermission('incidencias:atender'), actualizarEstadoIncidencia);

export default router;