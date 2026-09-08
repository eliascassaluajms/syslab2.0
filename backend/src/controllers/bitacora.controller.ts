import { NextFunction, Request, Response } from 'express';
import { TipoUsoLaboratorio } from '@prisma/client';
import { bitacoraService } from '../services/bitacora.service.js';
import { AppError } from '../utils/appError.js';

export class BitacoraController {
  async iniciar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        laboratorioId,
        materiaId,
        docenteId,
        nombreAyudante,
        materiaNombre,
        tipoUso,
        solicitudExtraordinariaId,
        practicaRealizada,
      } = req.body;

      if (!laboratorioId) {
        throw new AppError('El parámetro laboratorioId es requerido.', 400);
      }

      const esAdminOJefe =
        req.user?.rol === 'Administrador' ||
        req.user?.rol === 'Jefe de Laboratorios' ||
        req.user?.esGlobal;

      // Si es admin o jefe, puede iniciar con el docente enviado o detectado; si no es admin, se usa su propio ID.
      const idDocenteFinal =
        esAdminOJefe && docenteId 
          ? Number(docenteId) 
          : (esAdminOJefe && !docenteId ? undefined : (req.user?.id ? Number(req.user.id) : undefined));

      if (!esAdminOJefe && docenteId && Number(docenteId) !== idDocenteFinal) {
        throw new AppError('El docente de la sesión debe coincidir con el usuario autenticado.', 403);
      }

      const sesion = await bitacoraService.iniciarSesion({
        laboratorioId: Number(laboratorioId),
        materiaId: materiaId ? Number(materiaId) : undefined,
        docenteId: idDocenteFinal,
        nombreAyudante: nombreAyudante ? String(nombreAyudante) : undefined,
        materiaNombre: materiaNombre ? String(materiaNombre) : undefined,
        tipoUso: tipoUso as TipoUsoLaboratorio | undefined,
        solicitudExtraordinariaId: solicitudExtraordinariaId ? Number(solicitudExtraordinariaId) : undefined,
        practicaRealizada: practicaRealizada ? String(practicaRealizada) : undefined,
        esAdminOJefe, // <--- Propiedad enviada para relajar restricciones de rol y tiempo
      });

      res.status(201).json({
        status: 'success',
        data: { sesion },
      });
    } catch (error) {
      next(error);
    }
  }

  async finalizar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { practicaRealizada, cumplio } = req.body;

      const sesion = await bitacoraService.finalizarSesion(Number(id), {
        practicaRealizada: practicaRealizada ? String(practicaRealizada) : undefined,
        cumplio: cumplio !== undefined ? Boolean(cumplio) : true,
      });

      res.status(200).json({
        status: 'success',
        data: { sesion },
      });
    } catch (error) {
      next(error);
    }
  }

  async validarToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token } = req.params;
      const publicData = await bitacoraService.validarTokenQR(String(token));

      res.status(200).json(publicData);
    } catch (error) {
      next(error);
    }
  }

  async marcarAsistencia(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const estudianteId = req.user?.id;
      if (!estudianteId) {
        throw new AppError('Debe iniciar sesión como estudiante para registrar su asistencia.', 401);
      }

      const { tokenQR, token, codigoEquipoPatrimonial, codigoEquipo } = req.body;
      const tokenFinal = tokenQR || token;

      if (!tokenFinal) {
        throw new AppError('El token QR de la sesión es requerido.', 400);
      }

      const resultado = await bitacoraService.registrarAsistenciaEstudiante({
        tokenQR: String(tokenFinal),
        estudianteId: Number(estudianteId),
        codigoEquipoPatrimonial:
          codigoEquipoPatrimonial || codigoEquipo
            ? String(codigoEquipoPatrimonial || codigoEquipo)
            : undefined,
      });

      res.status(200).json({
        status: 'success',
        message: 'Asistencia registrada exitosamente.',
        data: resultado,
      });
    } catch (error) {
      next(error);
    }
  }

  async obtenerNomina(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sesionId = req.params.sesionId || req.params.id;

      if (!sesionId) {
        throw new AppError('El parámetro sesionId es requerido.', 400);
      }

      const nomina = await bitacoraService.obtenerNominaSesion(Number(sesionId));

      res.status(200).json({
        status: 'success',
        results: nomina.length,
        data: { nomina },
      });
    } catch (error) {
      next(error);
    }
  }

  async listar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filtros = {
        laboratorioId: req.query.laboratorioId ? Number(req.query.laboratorioId) : undefined,
        fecha: req.query.fecha ? String(req.query.fecha) : undefined,
        cumplio: req.query.cumplio !== undefined ? req.query.cumplio === 'true' : undefined,
      };

      const sesiones = await bitacoraService.listarSesiones(filtros);

      res.status(200).json({
        status: 'success',
        results: sesiones.length,
        data: { sesiones },
      });
    } catch (error) {
      next(error);
    }
  }

  async descargarPDF(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = req.params.id || req.params.sesionId;

      if (!id) {
        throw new AppError('El id de la sesión de bitácora es requerido.', 400);
      }

      const pdfBuffer = await bitacoraService.generarPDFSesion(Number(id));

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="planilla-bitacora-${id}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }
}

export const bitacoraController = new BitacoraController();
