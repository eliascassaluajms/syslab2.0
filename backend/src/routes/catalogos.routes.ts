import { Router } from 'express';
import {
  obtenerFacultades,
  crearFacultad,
  obtenerCarreras,
  crearCarrera,
} from '../controllers/catalogos.controller.js';

const router = Router();

// TEMPORAL: Sin protección JWT para pruebas
router.get('/facultades', obtenerFacultades);
router.post('/facultades', crearFacultad);
router.get('/carreras', obtenerCarreras);
router.post('/carreras', crearCarrera);

export default router;