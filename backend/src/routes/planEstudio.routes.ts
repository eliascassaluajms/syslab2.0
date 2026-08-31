// backend/src/routes/planEstudio.routes.ts
import { Router } from 'express';
import { planEstudioController } from '../controllers/planEstudio.controller.js';
import { verificarJWT } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/authorize.middleware.js';

const router = Router();

// Todas las rutas requieren estar autenticado
router.use(verificarJWT);

// Rutas de Planes de Estudio
router.post(
  '/', 
  requirePermission('planes_estudio:crear'), 
  planEstudioController.crear
);

router.get(
  '/carrera/:carreraId', 
  requirePermission('planes_estudio:listar'), 
  planEstudioController.listarPorCarrera
);

router.get(
  '/:id', 
  requirePermission('planes_estudio:listar'), 
  planEstudioController.obtenerUno
);

router.put(
  '/:id', 
  requirePermission('planes_estudio:editar'), 
  planEstudioController.actualizar
);

router.delete(
  '/:id', 
  requirePermission('planes_estudio:eliminar'), 
  planEstudioController.eliminar
);

export default router;