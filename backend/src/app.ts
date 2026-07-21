import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import authRouter from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { AppError } from './utils/appError.js';
import roleRoutes from './routes/role.routes.js';
import catalogosRoutes from './routes/catalogos.routes.js';
import laboratoriosRoutes from './routes/laboratorios.routes.js';

// 1. Inicializar la aplicación Express PRIMERO
const app: Application = express();

// 2. Configurar Middlewares Globales
const rawOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
const cleanOrigin = rawOrigin.replace(/\/$/, '');

// ==========================================
// CONFIGURACIÓN DE CORS
// ==========================================
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

app.use(express.json());

// 3. Ruta de Salud / Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'SysLab 2.0 API está respondiendo correctamente.',
    timestamp: new Date().toISOString()
  });
});

// 4. Montaje de Rutas de la API
app.use('/api/auth', authRouter);
app.use('/api/usuarios', userRoutes); // Conecta /api/usuarios al router existente
app.use('/api/roles', roleRoutes);
app.use('/api/catalogos', catalogosRoutes);
app.use('/api/laboratorios', laboratoriosRoutes);

// 5. Manejo de Rutas No Encontradas (SIEMPRE debe ir al final de las rutas)
app.all('*', (req: Request, res: Response) => {
  throw new AppError(`No se pudo encontrar la ruta ${req.originalUrl} en este servidor.`, 404);
});

// 6. Middleware Global de Manejo de Errores
app.use(errorHandler);

export default app;