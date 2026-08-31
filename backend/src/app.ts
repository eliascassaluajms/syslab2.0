import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import authRouter from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { AppError } from './utils/appError.js';
import roleRoutes from './routes/role.routes.js';
import catalogosRoutes from './routes/catalogos.routes.js';
import laboratoriosRoutes from './routes/laboratorios.routes.js';
import equiposRoutes from './routes/equipos.routes.js';
import incidenciasRoutes from './routes/incidencias.routes.js';
import planEstudioRouter from './routes/planEstudio.routes.js';
import materiaRouter from './routes/materia.routes.js';
import categoriaEventoRoutes from './routes/categoriaEvento.routes.js';
import activityRoutes from './routes/activity.routes.js';
import eventoRoutes from './routes/evento.routes.js';
import eventoPaymentConfigRoutes from './routes/eventoPaymentConfig.routes.js';
import eventoParticipanteRoutes from './routes/eventoParticipante.routes.js';
import horarioRoutes from './routes/horarios.routes.js';
import solicitudExtraordinariaRoutes from './routes/solicitudExtraordinaria.routes.js';
import bitacoraRoutes from './routes/bitacora.routes.js';
import asistenciaRoutes from './routes/asistencia.routes.js';

const app: Application = express();

const rawOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
const cleanOrigin = rawOrigin.replace(/\/$/, '');
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  cleanOrigin,
  'http://0.0.0.0:5173',
];

app.use(
  cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

app.use(express.json());

// Exposición pública de medios estáticos del frontend
app.use('/frontend/media', express.static(path.resolve(process.cwd(), '../frontend/media')));

app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'success',
    message: 'SysLab 2.0 API está respondiendo correctamente.',
    timestamp: new Date().toISOString(),
  });
});

// Rutas API
app.use('/api/auth', authRouter);
app.use('/api/usuarios', userRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/catalogos', catalogosRoutes);
app.use('/api/laboratorios', laboratoriosRoutes);
app.use('/api/equipos', equiposRoutes);
app.use('/api/incidencias', incidenciasRoutes);
app.use('/api/planes-estudio', planEstudioRouter);
app.use('/api/materias', materiaRouter);
app.use('/api/horarios', horarioRoutes);
app.use('/api/activities', activityRoutes);
app.use('/api/evento', eventoRoutes);

app.use('/api/actividades/categorias', categoriaEventoRoutes);
app.use('/api/categorias-eventos', categoriaEventoRoutes);
app.use('/api/categorias', categoriaEventoRoutes);

app.use('/api/payment-config', eventoPaymentConfigRoutes);
app.use('/api/evento-participantes', eventoParticipanteRoutes);
app.use('/api/solicitudes-extraordinarias', solicitudExtraordinariaRoutes);
app.use('/api/bitacora', bitacoraRoutes);
app.use('/api/asistencia', asistenciaRoutes);

app.all('*', (req: Request, res: Response) => {
  throw new AppError(`No se pudo encontrar la ruta ${req.originalUrl} en este servidor.`, 404);
});

app.use(errorHandler);

export default app;
