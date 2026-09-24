import { NextFunction, Request, Response } from 'express';
import { defensaService } from '../services/defensa.service.js';
import { AppError } from '../utils/appError.js';

const URL_DOCUMENTO = (filename: string) => `/api/documentos/trabajos/${filename}`;

export class DefensaController {
  async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      let carreraIdQuery = req.query.carreraId ? Number(req.query.carreraId) : undefined;
      const carrerasFiltro = user?.carreras?.length ? user.carreras.map(Number) : (user?.carreraId ? [Number(user.carreraId)] : undefined);

      const esDirector = !user?.esGlobal && (user?.rol === 'Director de Carrera' || user?.roles?.includes('Director de Carrera'));
      if (esDirector && carrerasFiltro && carrerasFiltro.length > 0) {
        if (carreraIdQuery && !carrerasFiltro.includes(carreraIdQuery)) {
          carreraIdQuery = carrerasFiltro[0];
        } else if (!carreraIdQuery) {
          carreraIdQuery = carrerasFiltro[0];
        }
      }

      const trabajos = await defensaService.listarTrabajos({
        carreraId: carreraIdQuery,
        gestion: req.query.gestion ? Number(req.query.gestion) : undefined,
        estado: req.query.estado ? String(req.query.estado) : undefined,
        soloMios: req.query.soloMios === 'true' || req.query.mios === 'true',
        usuarioId: user?.id,
        roles: user?.roles,
        carreras: carrerasFiltro,
      });

      res.status(200).json({ status: 'success', results: trabajos.length, data: trabajos });
    } catch (error) {
      next(error);
    }
  }

  async obtenerEstudiantesElegibles(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as any).user;
      let carreraId = req.query.carreraId ? Number(req.query.carreraId) : undefined;
      const esDirector = !user?.esGlobal && (user?.rol === 'Director de Carrera' || user?.roles?.includes('Director de Carrera'));
      const carrerasUsuario = user?.carreras?.length ? user.carreras.map(Number) : (user?.carreraId ? [Number(user.carreraId)] : []);

      if (esDirector && carrerasUsuario.length > 0) {
        if (!carreraId || !carrerasUsuario.includes(carreraId)) {
          carreraId = carrerasUsuario[0];
        }
      }

      if (!carreraId) {
        throw new AppError('Debe especificar la carrera para listar los estudiantes.', 400);
      }

      const estudiantes = await defensaService.obtenerEstudiantesElegibles({
        carreraId,
        materiaId: req.query.materiaId ? Number(req.query.materiaId) : undefined,
        gestion: req.query.gestion ? Number(req.query.gestion) : undefined,
        busqueda: req.query.busqueda ? String(req.query.busqueda) : undefined,
        todos: req.query.todos === 'true' || req.query.general === 'true',
      });

      res.status(200).json({ status: 'success', results: estudiantes.length, data: estudiantes });
    } catch (error) {
      next(error);
    }
  }

  async obtenerDocentesTribunal(req: Request, res: Response, next: NextFunction) {
    try {
      const carreraId = req.query.carreraId ? Number(req.query.carreraId) : undefined;
      if (!carreraId) {
        throw new AppError('Debe especificar la carrera para listar los docentes elegibles.', 400);
      }
      const docentes = await defensaService.obtenerDocentesTribunal(carreraId);
      res.status(200).json({ status: 'success', results: docentes.length, data: docentes });
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
      const user = (req as any).user;
      const esDirector = !user?.esGlobal && (user?.rol === 'Director de Carrera' || user?.roles?.includes('Director de Carrera'));
      const carrerasUsuario = user?.carreras?.length ? user.carreras.map(Number) : (user?.carreraId ? [Number(user.carreraId)] : []);

      if (esDirector && carrerasUsuario.length > 0) {
        const carreraSolicitada = Number(req.body.carreraId);
        if (!carrerasUsuario.includes(carreraSolicitada)) {
          throw new AppError('No tiene autorización para registrar trabajos de grado en otra carrera.', 403);
        }
      }

      const trabajo = await defensaService.crearTrabajo(req.body);
      res.status(201).json({ status: 'success', data: trabajo });
    } catch (error) {
      next(error);
    }
  }

  async actualizar(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const trabajo = await defensaService.actualizarTrabajo(id, req.body);
      res.status(200).json({ status: 'success', data: trabajo });
    } catch (error) {
      next(error);
    }
  }

  async eliminar(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const resultado = await defensaService.eliminarTrabajo(id);
      res.status(200).json({ status: 'success', data: resultado });
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
      const resultado = await defensaService.asignarTribunales(req.params.id, tribunales);
      res.status(200).json({ status: 'success', data: resultado });
    } catch (error) {
      next(error);
    }
  }

  async subirVersion(req: Request, res: Response, next: NextFunction) {
    try {
      const { descripcionCambios } = req.body;
      const archivo = (req as any).file;

      let archivoUrl = req.body.archivoUrl;
      if (archivo) {
        archivoUrl = URL_DOCUMENTO(archivo.filename);
      }

      if (!archivoUrl) {
        throw new AppError('Debe adjuntar el documento (PDF) o indicar la URL de la versión.', 400);
      }

      const version = await defensaService.registrarVersion(req.params.id, archivoUrl, descripcionCambios);
      res.status(201).json({ status: 'success', data: version });
    } catch (error) {
      next(error);
    }
  }

  async registrarObservacion(req: Request, res: Response, next: NextFunction) {
    try {
      const { designacionId, detalleObservacion, esExtraordinaria } = req.body;
      const archivo = (req as any).file;

      if (!designacionId) {
        throw new AppError('Debe indicar la designación de tribunal.', 400);
      }

      let archivoCorreccionesUrl = req.body.archivoCorreccionesUrl;
      if (archivo) {
        archivoCorreccionesUrl = URL_DOCUMENTO(archivo.filename);
      }

      const observacion = await defensaService.registrarObservacion(
        req.params.id,
        designacionId,
        detalleObservacion || '',
        archivoCorreccionesUrl || undefined,
        esExtraordinaria === true || esExtraordinaria === 'true'
      );
      res.status(201).json({ status: 'success', data: observacion });
    } catch (error) {
      next(error);
    }
  }

  async actualizarFechaLimite(req: Request, res: Response, next: NextFunction) {
    try {
      const { designacionId, fechaLimite } = req.body;
      if (!designacionId || !fechaLimite) {
        throw new AppError('Debe enviar la designación y la nueva fecha límite.', 400);
      }
      const designacion = await defensaService.actualizarFechaLimite(req.params.id, designacionId, fechaLimite);
      res.status(200).json({ status: 'success', data: designacion });
    } catch (error) {
      next(error);
    }
  }

  async emitirConformidad(req: Request, res: Response, next: NextFunction) {
    try {
      const { designacionId } = req.body;
      if (!designacionId) {
        throw new AppError('Debe enviar la designación del tribunal.', 400);
      }
      const conformidad = await defensaService.emitirConformidad(req.params.id, designacionId);
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

  async obtenerControlMemorandum(req: Request, res: Response, next: NextFunction) {
    try {
      const carreraId = Number(req.params.carreraId || req.query.carreraId);
      if (!carreraId) {
        throw new AppError('Debe indicar la carrera.', 400);
      }
      const control = await defensaService.obtenerControlMemorandum(carreraId);
      res.status(200).json({ status: 'success', data: control });
    } catch (error) {
      next(error);
    }
  }

  async actualizarControlMemorandum(req: Request, res: Response, next: NextFunction) {
    try {
      const { carreraId, gestion, ultimoNumero } = req.body;
      if (!carreraId || !gestion) {
        throw new AppError('Debe indicar la carrera y la gestión académica.', 400);
      }
      const control = await defensaService.actualizarControlMemorandum(carreraId, gestion, ultimoNumero);
      res.status(200).json({ status: 'success', data: control });
    } catch (error) {
      next(error);
    }
  }
}

export const defensaController = new DefensaController();