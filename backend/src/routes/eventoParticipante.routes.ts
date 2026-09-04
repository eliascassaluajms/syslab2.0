import { Router, Request, Response, NextFunction } from 'express';
import { EventoParticipanteController } from '../controllers/eventoParticipante.controller.js';
import { verificarJWT } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/authorize.middleware.js';
import { uploadComprobante, uploadComprobanteMemory } from '../middlewares/upload.middleware.js';
import { uploadExtracto } from '../middlewares/uploadExcel.middleware.js';
import { conciliacionController } from '../controllers/conciliacion.controller.js';
import { ocrRateLimiter, preinscripcionRateLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router();

// POST /api/evento-participantes (crear preinscripción pública protegida)
router.post('/', preinscripcionRateLimiter, (req: Request, res: Response, next: NextFunction) => {
  EventoParticipanteController.crear(req, res).catch(next);
});

// POST /api/evento-participantes/matricular-manual (matriculación directa por admin)
router.post('/matricular-manual',
  verificarJWT,
  requirePermission('actividades:participantes_listar'),
  (req: Request, res: Response, next: NextFunction) => {
    EventoParticipanteController.matricularManual(req, res).catch(next);
  }
);

// GET /api/evento-participantes/verificados/:activityId (lista de verificados para impresión)
router.get('/verificados/:activityId',
  verificarJWT,
  requirePermission('actividades:participantes_listar'),
  (req: Request, res: Response, next: NextFunction) => {
    EventoParticipanteController.listarVerificadosPorActividad(req, res).catch(next);
  }
);

// POST /api/evento-participantes/ocr (DEBE IR ANTES DE /:id)
// Endpoint público para escaneo OCR de comprobantes protegido con Rate Limit y Multer en memoria
router.post('/ocr', 
  ocrRateLimiter,
  uploadComprobanteMemory.single('comprobante'),
  (req: Request, res: Response, next: NextFunction) => {
    EventoParticipanteController.procesarComprobanteOCR(req, res, next).catch(next);
  }
);

router.post('/conciliar-extracto',
  verificarJWT,
  requirePermission('actividades:pagos_validar'),
  uploadExtracto.single('extracto'),
  (req: Request, res: Response, next: NextFunction) => {
    conciliacionController.procesarExtractoBancario(req, res, next).catch(next);
  },
);

router.get('/reporte-financiero/:actividadId',
  verificarJWT,
  requirePermission('actividades:pagos_validar'),
  (req: Request, res: Response, next: NextFunction) => {
    conciliacionController.obtenerReporteFinanciero(req, res, next).catch(next);
  },
);

// GET /api/evento-participantes
router.get('/', 
  verificarJWT,
  requirePermission('actividades:participantes_listar'),
  (req: Request, res: Response, next: NextFunction) => {
    EventoParticipanteController.listar(req, res).catch(next);
  }
);

// PATCH /api/evento-participantes/:id/validar-pago
router.patch('/:id/validar-pago', 
  verificarJWT,
  requirePermission('actividades:pagos_validar'),
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

// POST /api/evento-participantes/:id/comprobante
// Endpoint multipart/form-data protegido para admin
router.post('/:id/comprobante',
  verificarJWT,
  requirePermission('actividades:pagos_registrar'),
  uploadComprobante.single('comprobante'),
  (req: Request, res: Response, next: NextFunction) => {
    EventoParticipanteController.subirComprobante(req, res).catch(next);
  }
);

// PUT /api/evento-participantes/:id
router.put('/:id', 
  verificarJWT,
  requirePermission('actividades:participantes_listar'),
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.params.id) {
      res.status(400).json({ error: 'El ID del participante es requerido.' });
      return;
    }
    EventoParticipanteController.actualizar(req, res).catch(next);
  }
);

// PATCH /api/evento-participantes/:id
router.patch('/:id',
  verificarJWT,
  requirePermission('actividades:participantes_listar'),
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.params.id) {
      res.status(400).json({ error: 'El ID del participante es requerido.' });
      return;
    }
    EventoParticipanteController.actualizar(req, res).catch(next);
  }
);

// DELETE /api/evento-participantes/:id
router.delete('/:id',
  verificarJWT,
  requirePermission('actividades:participantes_listar'),
  (req: Request, res: Response, next: NextFunction) => {
    if (!req.params.id) {
      res.status(400).json({ error: 'El ID del participante es requerido.' });
      return;
    }
    EventoParticipanteController.eliminar(req, res).catch(next);
  }
);

export default router;
