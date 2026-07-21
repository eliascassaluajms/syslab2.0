import { Router } from 'express';
import {
  obtenerLaboratorios,
  crearLaboratorio,
  actualizarLaboratorio,
  cambiarEstadoLaboratorio,
} from '../controllers/laboratorios.controller.js';

const router = Router();

// Definición limpia de endpoints HTTP
router.get('/', obtenerLaboratorios);
router.post('/', crearLaboratorio);
router.put('/:id', actualizarLaboratorio);
router.patch('/:id/estado', cambiarEstadoLaboratorio);

export default router;