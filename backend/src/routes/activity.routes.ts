import { Router } from 'express';
import { ActivityController } from '../controllers/activity.controller.js';
import { verificarJWT } from '../middlewares/auth.middleware.js';
import { publicRateLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

// GET /api/activities - Listar actividades
router.get('/', publicRateLimiter(60, 60 * 1000), ActivityController.listar);

// POST /api/activities - Crear actividad
router.post('/', verificarJWT, ActivityController.crear);

export default router;