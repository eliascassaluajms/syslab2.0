import { Router } from 'express';
import { ParticipanteEventoController } from '../controllers/participanteEvento.controller';

const router = Router();

// Endpoint público para obtener la configuración de pago (QR y cuentas bancarias)
router.get('/pago-config', ParticipanteEventoController.getConfiguracionPago);

// Endpoint público para la preinscripción del participante
router.post('/registro', ParticipanteEventoController.registrar);

// Endpoint para listar participantes
router.get('/participantes', ParticipanteEventoController.listar);

export default router;
