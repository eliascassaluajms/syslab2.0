import { Router } from 'express';
import { authController } from '../controllers/auth.controller.js';

const router = Router();

// POST /api/auth/login -> Endpoint público de acceso general
router.post('/login', authController.login);

// POST /api/auth/login-docente -> Acceso exclusivo para el personal docente (mobile-docente)
router.post('/login-docente', authController.loginDocente);

// POST /api/auth/refresh -> Renovación de sesión con rotación de refresh token
router.post('/refresh', authController.refrescarToken);

// POST /api/auth/logout -> Revocación de refresh token / cierre de sesión
router.post('/logout', authController.logout);

export default router;