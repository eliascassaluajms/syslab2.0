import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import authRouter from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js'; // 👈 Importación del router de usuarios
import { errorHandler } from './middlewares/errorHandler.js';
import { AppError } from './utils/appError.js';

const app: Application = express();

const rawOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
const cleanOrigin = rawOrigin.replace(/\/$/, '');

app.use(cors({
  origin: [cleanOrigin, `${cleanOrigin}/`],
  credentials: true
}));

app.use(express.json());

// --- MONTAJE DE RUTAS DEL SISTEMA ---
app.use('/api/auth', authRouter);
app.use('/api/usuarios', userRoutes); // 👈 Corregido a /api/usuarios (coincide con el frontend)

// Ruta de Salud
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'SysLab 2.0 API está respondiendo correctamente.',
    timestamp: new Date().toISOString()
  });
});

// Manejo de Rutas No Encontradas (SIEMPRE debe ser la última ruta definida)
app.all('*', (req: Request, res: Response, next) => {
  next(new AppError(`No se pudo encontrar la ruta ${req.originalUrl} en este servidor.`, 404));
});

app.use(errorHandler);

export default app;