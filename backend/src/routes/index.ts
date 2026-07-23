import { Router } from 'express';
import authRouter from './auth.routes.js';
import userRouter from './user.routes.js';
import roleRouter from './role.routes.js';
import laboratoriosRouter from './laboratorios.routes.js';
import catalogosRouter from './catalogos.routes.js';
import equiposRoutes from './equipos.routes.js';

// ...
export const router = Router();

router.use('/auth', authRouter);
router.use('/usuarios', userRouter);
router.use('/roles', roleRouter);
router.use('/laboratorios', laboratoriosRouter);
router.use('/catalogos', catalogosRouter);
router.use('/equipos', equiposRoutes);
