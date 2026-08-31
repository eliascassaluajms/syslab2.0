import { Router, Request, Response, NextFunction } from 'express';
import { EventoParticipanteController } from '../controllers/eventoParticipante.controller.js';
import { verificarJWT } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/authorize.middleware.js';
import { uploadComprobante } from '../middlewares/upload.middleware.js';

const router = Router();

router.post('/', (req: Request, res: Response, next: NextFunction) => {
  EventoParticipanteController.crear(req, res).catch(next);
});

router.get('/', 
  verificarJWT,
  requirePermission('participantes:listar'),
  (req: Request, res: Response, next: NextFunction) => {
    EventoParticipanteController.listar(req, res).catch(next);
  }
);

router.patch('/:id/validar-pago', 
  verificarJWT,
  requirePermission('participantes:validar_pago'),
  (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { estado } = req.body;

    if (!id || !estado) {
      res.status(400).json({ error: 'El ID del participante y el estado son requeridos.' });
      return;
    }

    EventoParticipanteController.validarPago(req, res).catch(next);
  }
);

router.put('/:id', 
  verificarJWT,
  requirePermission('participantes:editar'),
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.params.id) {
      res.status(400).json({ error: 'El ID del participante es requerido.' });
      return;
    }
    EventoParticipanteController.actualizar(req, res).catch(next);
  }
);

router.delete('/:id',
  verificarJWT,
  requirePermission('participantes:eliminar'),
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.params.id) {
      res.status(400).json({ error: 'El ID del participante es requerido.' });
      return;
    }
    EventoParticipanteController.eliminar(req, res).catch(next);
  }
);

// POST /api/evento-participantes/:id/comprobante
// Endpoint multipart/form-data protegido
router.post('/:id/comprobante',
  verificarJWT,
  requirePermission('actividades:pagos_registrar'),
  uploadComprobante.single('comprobante'),
  (req: Request, res: Response, next: NextFunction) => {
    EventoParticipanteController.subirComprobante(req, res).catch(next);
  }
);

export default router;
