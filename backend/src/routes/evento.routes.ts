import { Router } from 'express';
import { ParticipanteEventoController } from '../controllers/participanteEvento.controller.js';
import { publicRateLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

// Endpoints públicos protegidos contra abuso automatizado (máximo 10 registros por minuto por IP)
router.get('/pago-config', publicRateLimiter(30, 60 * 1000), ParticipanteEventoController.getConfiguracionPago);
router.post('/registro', publicRateLimiter(10, 60 * 1000), ParticipanteEventoController.registrar);

// Endpoint de administración
router.get('/participantes', ParticipanteEventoController.listar);

export default router;
