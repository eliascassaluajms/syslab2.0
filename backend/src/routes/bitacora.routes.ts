import { Router } from 'express';
import { bitacoraController } from '../controllers/bitacora.controller.js';
import { asistenciaController } from '../controllers/asistencia.controller.js';
import { verificarJWT } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/authorize.middleware.js';

const router = Router();

// 1. Endpoint público para validar token del QR escaneado
router.get('/sesion/:token', bitacoraController.validarToken);

// Todas las rutas siguientes requieren sesión activa con JWT
router.use(verificarJWT);

// 2. Gestión del ciclo de vida de la sesión (Docente / Jefatura)
router.post('/iniciar', requirePermission('bitacora:iniciar'), bitacoraController.iniciar);
router.patch('/:id/finalizar', requirePermission('bitacora:finalizar'), bitacoraController.finalizar);
router.get('/', requirePermission('bitacora:consultar'), bitacoraController.listar);
router.get('/:id/pdf', requirePermission('bitacora:consultar'), bitacoraController.descargarPDF);
router.get('/:sesionId/asistencia-pdf', requirePermission('bitacora:consultar'), bitacoraController.descargarPDF);

// 3. Marcado de asistencia estudiantil (El alumno autenticado escanea el QR)
router.post(
  '/marcar-asistencia',
  requirePermission('bitacora:consultar'),
  bitacoraController.marcarAsistencia
);

// 4. Consulta de nómina cruzada con Tariquía (Matriculados vs Presentes / Faltas)
router.get(
  '/:sesionId/nomina',
  requirePermission('bitacora:consultar'),
  bitacoraController.obtenerNomina
);

// 5. Endpoints complementarios de control y asistencia docente
router.get(
  '/:sesionId/asistentes',
  requirePermission('bitacora:consultar'),
  asistenciaController.listarPorSesion
);
router.get(
  '/:sesionId/asistencia',
  requirePermission('bitacora:consultar'),
  asistenciaController.obtenerListaConsolidada
);
router.get(
  '/:sesionId/lista',
  requirePermission('bitacora:consultar'),
  asistenciaController.obtenerListaConsolidada
);
router.put(
  '/:sesionId/asistencia/:estudianteId',
  requirePermission('bitacora:finalizar'),
  asistenciaController.actualizar
);
router.post(
  '/:sesionId/confirmar-asistencia',
  requirePermission('bitacora:finalizar'),
  asistenciaController.confirmar
);

export default router;
