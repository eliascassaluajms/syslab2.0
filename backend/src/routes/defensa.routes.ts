import { Router } from 'express';
import { verificarJWT } from '../middlewares/auth.middleware.js';
import { requirePermission } from '../middlewares/authorize.middleware.js';
import { defensaController } from '../controllers/defensa.controller.js';
import { subirDocumentoTrabajo } from '../middlewares/trabajo.upload.middleware.js';

const router = Router();
router.use(verificarJWT);

// ─── Listado y CRUD de trabajos de grado ────────────────────────────────────
router.get('/', requirePermission('defensas:listar'), defensaController.listar);
router.get('/trabajos', requirePermission('defensas:listar'), defensaController.listar);
router.get('/mis-trabajos', requirePermission('defensas:listar'), defensaController.listar);
router.get('/estudiantes-elegibles', requirePermission('defensas:crear'), defensaController.obtenerEstudiantesElegibles);
router.get('/docentes-tribunal', requirePermission('defensas:designar'), defensaController.obtenerDocentesTribunal);
router.post('/trabajos', requirePermission('defensas:crear'), defensaController.crear);
router.get('/trabajos/:id', requirePermission('defensas:listar'), defensaController.obtenerPorId);
router.put('/trabajos/:id', requirePermission('defensas:editar'), defensaController.actualizar);
router.delete('/trabajos/:id', requirePermission('defensas:eliminar'), defensaController.eliminar);

// ─── Tribunales ─────────────────────────────────────────────────────────────
router.post('/trabajos/:id/tribunales', requirePermission('defensas:designar'), defensaController.asignarTribunales);
router.put(
  '/trabajos/:id/tribunales/fecha-limite',
  requirePermission('defensas:designar'),
  defensaController.actualizarFechaLimite
);

// ─── Documentos (versiones) y observaciones del tribunal ───────────────────
router.post(
  '/trabajos/:id/versiones',
  requirePermission('defensas:crear'),
  subirDocumentoTrabajo.single('archivo'),
  defensaController.subirVersion
);
router.post(
  '/trabajos/:id/observaciones',
  requirePermission('defensas:observar'),
  subirDocumentoTrabajo.single('archivo'),
  defensaController.registrarObservacion
);
router.post('/trabajos/:id/conformidad', requirePermission('defensas:observar'), defensaController.emitirConformidad);

// ─── PDFs ───────────────────────────────────────────────────────────────────
router.get('/trabajos/:id/acta-pdf', requirePermission('defensas:acta'), defensaController.generarActaPdf);
router.get('/trabajos/:id/memorandums/:tribunalId/pdf', requirePermission('defensas:designar'), defensaController.generarMemorandumPdf);
router.get('/trabajos/:id/acta', requirePermission('defensas:acta'), defensaController.generarActa);

// ─── Correlativo de memorándums (coordinación con secretaría) ──────────────
router.get(
  '/control-memorandum',
  requirePermission('defensas:designar'),
  defensaController.obtenerControlMemorandum
);
router.put(
  '/control-memorandum',
  requirePermission('defensas:designar'),
  defensaController.actualizarControlMemorandum
);

export default router;