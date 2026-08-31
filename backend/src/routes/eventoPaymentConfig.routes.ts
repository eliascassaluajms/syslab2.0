import { Router, Request, Response, NextFunction } from 'express';
import { EventoPaymentConfigController } from '../controllers/eventoPaymentConfig.controller.js';
import { verificarJWT } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/authorize.middleware.js';

const router = Router();

// GET /api/payment-config/activo
// Cualquier usuario autenticado (incluyendo estudiantes/participantes) puede ver los datos para pagar
router.get('/activo', 
  verificarJWT,
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
