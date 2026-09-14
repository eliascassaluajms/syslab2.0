import { Router } from 'express';
import { ActivityController } from '../controllers/activity.controller.js';
import { verificarJWT } from '../middlewares/auth.middleware.js';
import { publicRateLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

// GET /api/activities - Listar actividades
router.get('/', publicRateLimiter(60, 60 * 1000), ActivityController.listar);

// GET /api/activities/:id - Obtener actividad por ID
router.get('/:id', publicRateLimiter(60, 60 * 1000), ActivityController.obtenerPorId);

// POST /api/activities - Crear actividad
router.post('/', verificarJWT, ActivityController.crear);

// PUT /api/activities/:id - Actualizar actividad
router.put('/:id', verificarJWT, ActivityController.actualizar);

// PATCH /api/activities/:id/estado - Cambiar estado (activo/inactivo)
router.patch('/:id/estado', verificarJWT, ActivityController.cambiarEstado);

// DELETE /api/activities/:id - Eliminar actividad
router.delete('/:id', verificarJWT, ActivityController.eliminar);

export default router;