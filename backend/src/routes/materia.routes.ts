// backend/src/routes/materia.routes.ts
import { Router } from 'express';
import { materiaController } from '../controllers/materia.controller.js';
import { verificarJWT } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/authorize.middleware.js';

const router = Router();

router.use(verificarJWT);

router.get(
  '/', 
  requirePermission('materias:listar'), 
  materiaController.listarTodas
);

router.post(
  '/', 
  requirePermission('materias:crear'), 
  materiaController.crear
);

router.get(
  '/plan/:planId', 
  requirePermission('materias:listar'), 
  materiaController.listarPorPlan
);

router.get(
  '/:id', 
  requirePermission('materias:listar'), 
  materiaController.obtenerUno
);

router.put(
  '/:id', 
  requirePermission('materias:editar'), 
  materiaController.actualizar
);

router.delete(
  '/:id', 
  requirePermission('materias:eliminar'), 
  materiaController.eliminar
);

export default router;