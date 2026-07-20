// backend/src/routes/index.ts
import { Router } from 'express';
import authRouter from './auth.routes.js'; // Sin llaves si es export default
import userRouter from './user.routes.js'; // Sin llaves si es export default

export const router = Router();

router.use('/auth', authRouter);
router.use('/usuarios', userRouter);