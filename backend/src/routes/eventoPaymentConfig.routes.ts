import { Router, Request, Response, NextFunction } from 'express';
import { EventoPaymentConfigController } from '../controllers/eventoPaymentConfig.controller.js';
import { verificarJWT } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/authorize.middleware.js';
import { publicRateLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

// GET /api/payment-config
// Endpoint público para que los participantes puedan consultar los datos bancarios y QR de pago
router.get('/', 
  publicRateLimiter(60, 60 * 1000),
  (req: Request, res: Response, next: NextFunction) => {
    EventoPaymentConfigController.obtenerActivo(req, res).catch(next);
  }
);

// GET /api/payment-config/activo (alias)
router.get('/activo', 
  publicRateLimiter(60, 60 * 1000),
  (req: Request, res: Response, next: NextFunction) => {
    EventoPaymentConfigController.obtenerActivo(req, res).catch(next);
  }
);

// POST /api/payment-config
// Solo roles con capacidad de organizar eventos (Jefes, Operadores) pueden cambiar la cuenta bancaria
router.post('/', 
  verificarJWT,
  requirePermission('actividades:editar'),
  (req: Request, res: Response, next: NextFunction) => {
    EventoPaymentConfigController.guardar(req, res).catch(next);
  }
);

export default router;
