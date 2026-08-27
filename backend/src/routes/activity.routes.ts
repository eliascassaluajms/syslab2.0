import { Router } from 'express';
import { ActivityController } from '../controllers/activity.controller.js';
import { verificarJWT as authMiddleware } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', authMiddleware, ActivityController.listar);
router.post('/', authMiddleware, ActivityController.crear);

export default router;
