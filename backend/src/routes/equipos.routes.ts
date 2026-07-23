import { Router } from 'express';
import { 
  crearEquipo, 
  crearLoteEquipos, 
  listarEquiposPorLaboratorio 
} from '../controllers/equipos.controller.js';

const router = Router();

router.post('/', crearEquipo);                  // POST /api/equipos
router.post('/lote', crearLoteEquipos);          // POST /api/equipos/lote
router.get('/laboratorio/:laboratorioId', listarEquiposPorLaboratorio); // GET /api/equipos/laboratorio/1

export default router;