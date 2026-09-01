import { Router } from 'express';
import { bitacoraController } from '../controllers/bitacora.controller.js';
import { asistenciaController } from '../controllers/asistencia.controller.js';
import { verificarJWT } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/authorize.middleware.js';

const router = Router();

// Endpoint público para validación de token QR del estudiante
router.get('/sesion/:token', bitacoraController.validarToken);

// Rutas protegidas por autenticación JWT y RBAC
router.use(verificarJWT);

router.post('/iniciar', requirePermission('bitacora:iniciar'), bitacoraController.iniciar);
router.patch('/:id/finalizar', requirePermission('bitacora:finalizar'), bitacoraController.finalizar);
router.get('/', requirePermission('bitacora:consultar'), bitacoraController.listar);
router.get('/:id/pdf', requirePermission('bitacora:consultar'), bitacoraController.descargarPDF);

// Sondeo en tiempo real de estudiantes que marcaron asistencia
router.get(
  '/:sesionId/asistentes',
  requirePermission('bitacora:consultar'),
  asistenciaController.listarPorSesion
);

export default router;
