import { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { defensaService } from '../services/defensa.service.js';
import { AppError } from '../utils/appError.js';

export class DefensaController {
  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const trabajos = await defensaService.listarTrabajos({
        carreraId: req.query.carreraId ? Number(req.query.carreraId) : undefined,
        estado: req.query.estado ? String(req.query.estado) : undefined,
      });

      res.status(200).json({ status: 'success', results: trabajos.length, data: trabajos });
    } catch (error) {
      next(error);
    }
  }

  async obtenerPorId(req: Request, res: Response, next: NextFunction) {
    try {
      const trabajo = await defensaService.obtenerTrabajoPorId(req.params.id);
      res.status(200).json({ status: 'success', data: trabajo });
    } catch (error) {
      next(error);
    }
  }

  async crear(req: Request, res: Response, next: NextFunction) {
    try {
      const trabajo = await defensaService.crearTrabajo(req.body);
      res.status(201).json({ status: 'success', data: trabajo });
    } catch (error) {
      next(error);
    }
  }

  async actualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const trabajoActual = await defensaService.obtenerTrabajoPorId(id);
      const trabajo = await prisma.trabajoGrado.update({
        where: { id },
        data: {
          titulo: req.body.titulo ?? trabajoActual.titulo,
          modalidad: req.body.modalidad ?? trabajoActual.modalidad,
          gradoOptado: req.body.gradoOptado ?? trabajoActual.gradoOptado,
          estudianteNombre: req.body.estudianteNombre ?? trabajoActual.estudianteNombre,
          estudianteCi: req.body.estudianteCi ?? trabajoActual.estudianteCi,
          estudianteRu: req.body.estudianteRu ?? trabajoActual.estudianteRu,
          estudianteEmail: req.body.estudianteEmail ?? trabajoActual.estudianteEmail,
          estudianteTelefono: req.body.estudianteTelefono ?? trabajoActual.estudianteTelefono,
          carreraId: req.body.carreraId ? Number(req.body.carreraId) : trabajoActual.carreraId,
        },
      });

      res.status(200).json({ status: 'success', data: trabajo });
    } catch (error) {
      next(error);
    }
  }

  async asignarTribunales(req: Request, res: Response, next: NextFunction) {
    try {
      const { tribunales } = req.body;
      if (!Array.isArray(tribunales)) {
        throw new AppError('Debe enviar una lista válida de tribunales.', 400);
      }
      const trabajo = await defensaService.asignarTribunales(req.params.id, tribunales);
      res.status(200).json({ status: 'success', data: trabajo });
    } catch (error) {
      next(error);
    }
  }

  async subirVersion(req: Request, res: Response, next: NextFunction) {
    try {
      const { archivoUrl, descripcionCambios } = req.body;
      if (!archivoUrl) {
        throw new AppError('Debe indicar la URL del documento.', 400);
      }
      const version = await defensaService.registrarVersion(req.params.id, archivoUrl, descripcionCambios);
      res.status(201).json({ status: 'success', data: version });
    } catch (error) {
      next(error);
    }
  }

  async registrarObservacion(req: Request, res: Response, next: NextFunction) {
    try {
      const { designacionId, detalleObservacion, archivoCorreccionesUrl } = req.body;
      if (!designacionId || !detalleObservacion) {
        throw new AppError('Debe indicar la designación y la observación.', 400);
      }
      const observacion = await defensaService.registrarObservacion(req.params.id, designacionId, detalleObservacion, archivoCorreccionesUrl);
      res.status(201).json({ status: 'success', data: observacion });
    } catch (error) {
      next(error);
    }
  }

  async emitirConformidad(req: Request, res: Response, next: NextFunction) {
    try {
      const { designacionId, cartaConformidadUrl } = req.body;
      if (!designacionId || !cartaConformidadUrl) {
        throw new AppError('Debe enviar la designación y la URL del PDF de conformidad.', 400);
      }
      const conformidad = await defensaService.emitirConformidad(req.params.id, designacionId, cartaConformidadUrl);
      res.status(200).json({ status: 'success', data: conformidad });
    } catch (error) {
      next(error);
    }
  }

  async generarActa(req: Request, res: Response, next: NextFunction) {
    try {
      const acta = await defensaService.generarActa(req.params.id);
      res.status(200).json({ status: 'success', data: acta });
    } catch (error) {
      next(error);
    }
  }

  async generarMemorandumPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const pdfBuffer = await defensaService.generarMemorandumPdf(req.params.id, req.params.tribunalId);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="memorandum-${req.params.tribunalId}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }

  async generarActaPdf(req: Request, res: Response, next: NextFunction) {
    try {
      const pdfBuffer = await defensaService.generarActaPdf(req.params.id);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="acta-defensa-${req.params.id}.pdf"`);
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  }
}

export const defensaController = new DefensaController();
