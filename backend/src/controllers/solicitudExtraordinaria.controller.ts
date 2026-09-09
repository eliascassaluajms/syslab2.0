import { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { solicitudExtraordinariaService, EstadoSolicitud } from '../services/solicitudExtraordinaria.service.js';
import { AppError } from '../utils/appError.js';

export class SolicitudExtraordinariaController {
  /**
   * 1. Obtener materias disponibles para el usuario autenticado
   * (Docente / Autoridad con designaciones activas o pertenecientes a su carrera asignada).
   */
  async obtenerMateriasDisponibles(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuario = (req as any).user;

      const esGlobal =
        Boolean(usuario?.esGlobal) ||
        ['Administrador', 'SuperAdmin', 'Jefe de Laboratorios', 'Decano', 'Vicedecano'].includes(usuario?.rol) ||
        (Array.isArray(usuario?.roles) &&
          usuario.roles.some((r: string) =>
            ['Administrador', 'SuperAdmin', 'Jefe de Laboratorios', 'Decano', 'Vicedecano'].includes(r)
          ));

      const carreraId = usuario?.carreraId
        ? Number(usuario.carreraId)
        : Array.isArray(usuario?.carreras) && usuario.carreras.length > 0
        ? Number(usuario.carreras[0])
        : undefined;

      const orConditions: any[] = [
        // Materias donde el usuario tiene una designación docente registrada
        { designaciones: { some: { docenteId: Number(usuario?.id) } } },
      ];

      // Materias correspondientes a su carrera asignada en su perfil
      if (carreraId) {
        orConditions.push({ planEstudio: { carreraId } });
      }

      const materias = await prisma.materia.findMany({
        where: esGlobal ? {} : { OR: orConditions },
        include: {
          planEstudio: {
            include: {
              carrera: true,
            },
          },
        },
        orderBy: { nombre: 'asc' },
      });

      const materiasFormateadas = materias.map((m) => ({
        ...m,
        carrera: m.planEstudio?.carrera || null,
        carreraId: m.planEstudio?.carreraId || null,
      }));

      res.status(200).json({
        status: 'success',
        data: materiasFormateadas,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 2. Registrar nueva solicitud extraordinaria de laboratorio
   */
  async crear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        laboratorioId,
        docenteId,
        solicitadoPorDirector,
        nombreAyudante,
        materia,
        fecha,
        horaInicio,
        horaFin,
        motivo,
      } = req.body;

      const idDocenteFinal = docenteId ? Number(docenteId) : (req.user?.id ? Number(req.user.id) : undefined);

      const solicitud = await solicitudExtraordinariaService.crear({
        laboratorioId: Number(laboratorioId),
        docenteId: idDocenteFinal,
        solicitadoPorDirector: Boolean(solicitadoPorDirector),
        nombreAyudante: nombreAyudante ? String(nombreAyudante) : undefined,
        materia: String(materia || ''),
        fecha: String(fecha || ''),
        horaInicio: String(horaInicio || ''),
        horaFin: String(horaFin || ''),
        motivo: String(motivo || ''),
        usuarioId: req.user?.id ? Number(req.user.id) : undefined,
        esGlobal: req.user?.esGlobal,
      });

      res.status(201).json({
        status: 'success',
        data: { solicitud },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 3. Listar solicitudes registradas
   */
  async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filtros = {
        estado: req.query.estado ? (req.query.estado as EstadoSolicitud) : undefined,
        laboratorioId: req.query.laboratorioId ? Number(req.query.laboratorioId) : undefined,
        fecha: req.query.fecha ? String(req.query.fecha) : undefined,
      };

      const solicitudes = await solicitudExtraordinariaService.listar(filtros);

      res.status(200).json({
        status: 'success',
        results: solicitudes.length,
        data: { solicitudes },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * 4. Aprobar o Rechazar solicitud según el rol jerárquico
   */
  async cambiarEstadoSolicitud(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { estado, observaciones } = req.body;
      const usuario = (req as any).user;

      if (!estado) {
        throw new AppError('Debe especificar el nuevo estado ("APROBADO" o "RECHAZADO").', 400);
      }

      const solicitud = await prisma.solicitudHorarioExtraordinario.findUnique({
        where: { id: Number(id) },
        include: {
          laboratorio: {
            select: { id: true, nombre: true, carreraId: true, facultadId: true },
          },
          docente: {
            select: { id: true, nombre: true, apellido: true, correo: true },
          },
        },
      });

      if (!solicitud) {
        throw new AppError('Solicitud extraordinaria no encontrada.', 404);
      }

      // Validación de Jerarquía y Permisos
      const rol = usuario?.rol || (Array.isArray(usuario?.roles) ? usuario.roles[0] : '');
      const roles: string[] = Array.isArray(usuario?.roles) ? usuario.roles : (rol ? [rol] : []);

      const esAdminOGlobal =
        Boolean(usuario?.esGlobal) ||
        ['Administrador', 'SuperAdmin', 'Jefe de Laboratorios', 'Decano', 'Vicedecano'].some(
          (r) => roles.includes(r) || rol === r
        );

      let carreraIdSolicitud = solicitud.laboratorio?.carreraId;
      if (!carreraIdSolicitud && solicitud.materia) {
        const codigoMateria = solicitud.materia.split(' ')[0];
        const mat = await prisma.materia.findFirst({
          where: {
            OR: [
              { codigo: codigoMateria },
              { nombre: { contains: solicitud.materia, mode: 'insensitive' } },
            ],
          },
          include: { planEstudio: true },
        });
        carreraIdSolicitud = mat?.planEstudio?.carreraId ?? null;
      }

      const usuarioCarreraId = usuario?.carreraId
        ? Number(usuario.carreraId)
        : Array.isArray(usuario?.carreras) && usuario.carreras.length > 0
        ? Number(usuario.carreras[0])
        : undefined;

      const tieneAccesoCarrera =
        (usuarioCarreraId && carreraIdSolicitud === usuarioCarreraId) ||
        (Array.isArray(usuario?.carreras) && carreraIdSolicitud && usuario.carreras.includes(carreraIdSolicitud));

      const esDirectorDeSuCarrera =
        (rol === 'Director de Carrera' || roles.includes('Director de Carrera') || rol === 'DIRECTOR_CARRERA') &&
        tieneAccesoCarrera;

      if (!esAdminOGlobal && !esDirectorDeSuCarrera) {
        throw new AppError(
          'No cuenta con los privilegios necesarios para aprobar o rechazar esta solicitud en este ámbito.',
          403
        );
      }

      const solicitudActualizada = await solicitudExtraordinariaService.actualizarEstado(
        Number(id),
        estado as EstadoSolicitud
      );

      res.status(200).json({
        status: 'success',
        message: `Solicitud actualizada a estado: ${estado}`,
        data: {
          ...solicitudActualizada,
          solicitud: solicitudActualizada,
          observacionesAprobacion: observaciones || null,
          aprobadoPorId: usuario?.id ? Number(usuario.id) : null,
          fechaAprobacion: new Date(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  // Alias para retrocompatibilidad
  actualizarEstado = this.cambiarEstadoSolicitud;
}

export const solicitudExtraordinariaController = new SolicitudExtraordinariaController();
export const obtenerMateriasDisponibles = solicitudExtraordinariaController.obtenerMateriasDisponibles.bind(
  solicitudExtraordinariaController
);
export const cambiarEstadoSolicitud = solicitudExtraordinariaController.cambiarEstadoSolicitud.bind(
  solicitudExtraordinariaController
);
export const actualizarEstado = solicitudExtraordinariaController.actualizarEstado.bind(
  solicitudExtraordinariaController
);
