import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import authRouter from './routes/auth.routes.js'; // 👈 Importamos las nuevas rutas
import { errorHandler } from './middlewares/errorHandler.js';
import { AppError } from './utils/appError.js';
import userRequestsRouter from './routes/user.routes.js';

const app: Application = express();

const rawOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
// Removemos cualquier barra diagonal al final para evitar discrepancias estrictas
const cleanOrigin = rawOrigin.replace(/\/$/, '');

app.use(cors({
  origin: [cleanOrigin, `${cleanOrigin}/`],
  credentials: true
}));

app.use(express.json());

// --- MONTAJE DE RUTAS DEL SISTEMA ---
app.use('/api/auth', authRouter); // 👈 Registramos el endpoint /api/v1/auth/login
app.use('/api/users', userRequestsRouter);

// Ruta de Salud
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'SysLab 2.0 API está respondiendo correctamente.',
    timestamp: new Date().toISOString()
  });
});
// Manejo de Rutas No Encontradas
app.all('*', (req: Request, res: Response, next) => {
  next(new AppError(`No se pudo encontrar la ruta ${req.originalUrl} en este servidor.`, 404));
});

app.use(errorHandler);

export default app;

// ... resto de sus middlewares globales

