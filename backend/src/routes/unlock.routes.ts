import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { unlockController } from '../controllers/unlock.controller.js';
import { verificarJWT } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/authorize.middleware.js';

const router = Router();

// Par Emparejar la app de escritorio con un equipo del laboratorio (Jefe/Admin/Técnico)
router.post('/registrar', verificarJWT, requirePermission('equipos:crear'), unlockController.registrar);

// Bloqueo y consulta: autenticados mediante el device token de la app de escritorio
router.post('/bloquear', unlockController.bloquear);
router.get('/desafio/:desafioId', unlockController.consultar);

// Liberación: cualquier usuario autenticado con el código de 2 dígitos
const liberarLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  skip: () => process.env.NODE_ENV === 'test',
  message: {
    status: 'fail',
    message: 'Demasiados intentos de desbloqueo desde esta conexión. Intente más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
});

router.post('/liberar', verificarJWT, liberarLimiter, unlockController.liberar);

export default router;