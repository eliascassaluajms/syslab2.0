import { Router } from 'express';
import {
  solicitudExtraordinariaController,
  obtenerMateriasDisponibles,
  cambiarEstadoSolicitud,
} from '../controllers/solicitudExtraordinaria.controller.js';
import { protect } from '../middlewares/auth.middleware.js';
import { requirePermission, restrictTo } from '../middlewares/authorize.middleware.js';

const router = Router();

router.use(protect); // Todas requieren autenticación

// 1. Ruta para listar materias filtradas para el usuario actual (designaciones docentes o de su carrera)
router.get('/materias-disponibles', obtenerMateriasDisponibles);

// 2. Rutas CRUD generales
router.post(
  '/',
  requirePermission(['solicitudes:crear', 'solicitudes_extraordinarias:crear']),
  solicitudExtraordinariaController.crear
);
router.get(
  '/',
  requirePermission(['solicitudes:listar', 'solicitudes_extraordinarias:ver']),
  solicitudExtraordinariaController.listar
);

// 3. Ruta para aprobar/rechazar (restringida a Directores, Jefes y Admins)
router.patch(
  '/:id/estado',
  restrictTo(
    'Director de Carrera',
    'DIRECTOR_CARRERA',
    'Jefe de Laboratorios',
    'Administrador',
    'SuperAdmin',
    'Decano',
    'Vicedecano'
  ),
  cambiarEstadoSolicitud
);

export default router;
