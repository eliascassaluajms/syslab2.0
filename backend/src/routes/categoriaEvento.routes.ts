import { Router } from 'express';
import { CategoriaEventoController } from '../controllers/categoriaEvento.controller.js';

const router = Router();

// Endpoints estándar expuestos para el cliente
router.get('/', CategoriaEventoController.listar);
router.get('/:id', CategoriaEventoController.obtenerPorId);
router.post('/', CategoriaEventoController.crear);
router.patch('/:id', CategoriaEventoController.actualizar);
router.put('/:id', CategoriaEventoController.actualizar);
router.delete('/:id', CategoriaEventoController.eliminar);

export default router;