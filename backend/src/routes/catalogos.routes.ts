import { Router } from 'express';
import {
  obtenerFacultades,
  crearFacultad,
  obtenerCarreras,
  crearCarrera,
} from '../controllers/catalogos.controller.js';

const router = Router();

// ==========================================
// RUTAS DE FACULTADES
// ==========================================
router.get('/facultades', obtenerFacultades);
router.post('/facultades', crearFacultad);

// ==========================================
// RUTAS DE CARRERAS
// ==========================================
router.get('/carreras', obtenerCarreras);
router.post('/carreras', crearCarrera);

export default router;