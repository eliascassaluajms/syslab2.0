import { Router } from 'express';
import { ActivityController } from '../controllers/activity.controller.js';
import { verificarJWT } from '../middlewares/auth.middleware.js';
import { publicRateLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

// Endpoint público con tasa límite contra bots
router.get('/', publicRateLimiter(60, 60 * 1000), ActivityController.listar);

// Endpoints protegidos para administración
router.post('/', verificarJWT, ActivityController.crear);

export default router;
