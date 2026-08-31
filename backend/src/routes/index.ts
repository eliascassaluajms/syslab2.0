import { Router } from 'express';
import authRouter from './auth.routes.js';
import userRouter from './user.routes.js';
import roleRouter from './role.routes.js';
import laboratoriosRouter from './laboratorios.routes.js';
import catalogosRouter from './catalogos.routes.js';
import equiposRoutes from './equipos.routes.js';
import planEstudioRouter from './planEstudio.routes.js';
import materiaRouter from './materia.routes.js';
import activityRoutes from './activity.routes.js';
import solicitudExtraordinariaRoutes from './solicitudExtraordinaria.routes.js';
import bitacoraRoutes from './bitacora.routes.js';
import asistenciaRoutes from './asistencia.routes.js';

// ...
export const router = Router();

router.use('/auth', authRouter);
router.use('/usuarios', userRouter);
router.use('/roles', roleRouter);
router.use('/laboratorios', laboratoriosRouter);
router.use('/catalogos', catalogosRouter);
router.use('/equipos', equiposRoutes);
router.use('/planes-estudio', planEstudioRouter);
router.use('/materias', materiaRouter);
router.use('/actividades', activityRoutes);
router.use('/solicitudes-extraordinarias', solicitudExtraordinariaRoutes);
router.use('/bitacora', bitacoraRoutes);
router.use('/asistencia', asistenciaRoutes);