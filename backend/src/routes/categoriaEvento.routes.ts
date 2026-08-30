import { Router } from 'express';
import { CategoriaEventoController } from '../controllers/categoriaEvento.controller.js';
import { verificarJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// Endpoints protegidos para gestionar categorías (Delegados desde app.ts)
router.get('/', verificarJWT, CategoriaEventoController.listar);
router.get('/:id', verificarJWT, CategoriaEventoController.obtenerPorId);
router.post('/', verificarJWT, CategoriaEventoController.crear);
router.put('/:id', verificarJWT, CategoriaEventoController.actualizar);
router.patch('/:id', verificarJWT, CategoriaEventoController.cambiarEstado); // Soluciona el error 500
router.delete('/:id', verificarJWT, CategoriaEventoController.eliminar);

export default router;