import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';

const router = Router();

// POST /api/v1/auth/login -> Endpoint público de acceso
router.post('/login', authController.login);

export default router;