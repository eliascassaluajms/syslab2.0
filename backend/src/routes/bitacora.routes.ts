import { Router } from 'express';
import { bitacoraController } from '../controllers/bitacora.controller.js';
import { verificarJWT } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/authorize.middleware.js';

const router = Router();

// Endpoint público para validación de QR del estudiante
router.get('/sesion/:token', bitacoraController.validarToken);

// Rutas protegidas
router.use(verificarJWT);

router.post('/iniciar', requirePermission('bitacora:iniciar'), bitacoraController.iniciar);
router.patch('/:id/finalizar', requirePermission('bitacora:finalizar'), bitacoraController.finalizar);
router.get('/', requirePermission('bitacora:consultar'), bitacoraController.listar);
router.get('/:id/pdf', requirePermission('bitacora:consultar'), bitacoraController.descargarPDF);

export default router;
