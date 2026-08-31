import { Request, Response } from 'express';
import { EstadoInscripcion } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { prisma } from '../config/prisma.js';
import { extraerDatosComprobante, DatosTransaccionOCR } from '../services/ocr.service.js';

export const EventoParticipanteController = {
  async crear(req: Request, res: Response): Promise<void> {
    try {
      const { nombre, apellido, correo, telefono, tipo, activityId, codigoTransaccion, comprobanteUrl, observaciones } = req.body;

      if (!nombre || !apellido || !correo || !telefono || !activityId || !codigoTransaccion) {
        res.status(400).json({
          message: 'Faltan campos requeridos para la preinscripción.',
        });
        return;
      }

      const tipoNormalizado = tipo === 'PROFESIONAL' ? 'PROFESIONAL' : 'ESTUDIANTE';

      const participanteCreado = await prisma.eventoParticipante.create({
        data: {
          nombre,
          apellido,
          correo,
          telefono,
          tipo: tipoNormalizado,
          activityId: String(activityId),
          codigoTransaccion,
          ...(comprobanteUrl && { comprobanteUrl }),
          ...(observaciones !== undefined && { observaciones }),
          estado: EstadoInscripcion.PRE_INSCRITO,
        },
        include: {
          activity: { select: { id: true, title: true } },
        },
      });

      res.status(201).json(participanteCreado);
    } catch (error: any) {
      if (error?.code === 'P2002') {
        res.status(400).json({
          message: 'Ya existe una inscripción registrada con ese correo para esta actividad.',
        });
        return;
      }

      console.error('Error al crear participante:', error);
      res.status(500).json({ error: 'Error al procesar la preinscripción.' });
    }
  },

  async listar(req: Request, res: Response): Promise<void> {
    try {
      const participantes = await prisma.eventoParticipante.findMany({
        include: {
          activity: { select: { id: true, title: true } },
        },
        orderBy: { createdAt: 'desc' },
      });
      res.status(200).json(participantes);
    } catch (error) {
      console.error('Error al listar participantes:', error);
      res.status(500).json({ error: 'Error al obtener la lista de participantes.' });
    }
  },

  async validarPago(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { estado, observaciones } = req.body;

      if (!Object.values(EstadoInscripcion).includes(estado as EstadoInscripcion)) {
        res.status(400).json({ error: 'El estado especificado no es válido.' });
        return;
      }

      const participanteActualizado = await prisma.eventoParticipante.update({
        where: { id },
        data: {
          estado: estado as EstadoInscripcion,
          ...(observaciones !== undefined && { observaciones }),
        },
        include: {
          activity: { select: { id: true, title: true } },
        },
      });

      res.status(200).json(participanteActualizado);
    } catch (error) {
      console.error(`Error al validar pago para participante ${req.params.id}:`, error);
      res.status(500).json({ error: 'No se pudo registrar la validación del pago.' });
    }
  },

  async actualizar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { nombre, apellido, correo, telefono, tipo, estado, codigoTransaccion, observaciones } = req.body;

      if (!Object.values(EstadoInscripcion).includes(estado as EstadoInscripcion) && estado !== undefined) {
        res.status(400).json({ error: 'El estado especificado no es válido.' });
        return;
      }

      const participanteActualizado = await prisma.eventoParticipante.update({
        where: { id },
        data: {
          ...(nombre && { nombre }),
          ...(apellido && { apellido }),
          ...(correo && { correo }),
          ...(telefono !== undefined && { telefono }),
          ...(tipo && { tipo }),
          ...(estado && { estado: estado as EstadoInscripcion }),
          ...(codigoTransaccion !== undefined && { codigoTransaccion }),
          ...(observaciones !== undefined && { observaciones }),
        },
        include: {
          activity: { select: { id: true, title: true } },
        },
      });

      res.status(200).json(participanteActualizado);
    } catch (error) {
      console.error(`Error al actualizar participante ${req.params.id}:`, error);
      res.status(500).json({ error: 'Error al actualizar los datos del participante.' });
    }
  },

  async subirComprobante(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!req.file) {
        res.status(400).json({ error: 'No se proporcionó ningún archivo.' });
        return;
      }

      const participante = await prisma.eventoParticipante.findUnique({
        where: { id },
        include: {
          activity: true
        }
      });

      if (!participante) {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(404).json({ error: 'Participante no encontrado.' });
        return;
      }

      // Nombre del evento para la carpeta
      const nombreEventoCrudo = participante.activity?.title || 'evento_general';
      const nombreEventoSeguro = nombreEventoCrudo.replace(/[^a-zA-Z0-9-_]/g, '_');

      // Ruta física: /frontend/media/imagenes/<NombreDelEvento>/
      const targetDir = path.resolve(process.cwd(), `../frontend/media/imagenes/${nombreEventoSeguro}`);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }

      // Nombre del archivo: Nombre_Apellido_pago.<ext>
      const nombreParticipanteSeguro = `${participante.nombre}_${participante.apellido}`.replace(/[^a-zA-Z0-9-_]/g, '_');
      const ext = path.extname(req.file.originalname);
      const nombreArchivoFinal = `${nombreParticipanteSeguro}_pago${ext}`;
      const rutaDestinoFinal = path.join(targetDir, nombreArchivoFinal);

      // Trasladar archivo desde temporal a la ruta definitiva usando copy y unlink para evitar EXDEV
      fs.copyFileSync(req.file.path, rutaDestinoFinal);
      fs.unlinkSync(req.file.path);

      // URL pública para el frontend
      const comprobanteUrl = `/frontend/media/imagenes/${nombreEventoSeguro}/${nombreArchivoFinal}`;

      // Procesar OCR
      const datosOcr = await extraerDatosComprobante(rutaDestinoFinal);

      const participanteActualizado = await prisma.eventoParticipante.update({
        where: { id },
        data: {
          comprobanteUrl,
          codigoTransaccion: datosOcr.nroOrden || participante.codigoTransaccion,
          estado: EstadoInscripcion.PRE_INSCRITO
        }
      });

      res.status(200).json({
        message: 'Comprobante procesado exitosamente con OCR.',
        datosOcrExtracted: datosOcr,
        participante: participanteActualizado
      });
    } catch (error) {
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      console.error(`Error al procesar comprobante para participante ${req.params.id}:`, error);
      res.status(500).json({ error: 'Error interno al procesar el comprobante.' });
    }
  },

  async procesarComprobanteOCR(req: Request, res: Response): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No se proporcionó ningún archivo de comprobante.' });
        return;
      }

      console.log('[OCR] Archivo recibido:', {
        filename: req.file.filename,
        path: req.file.path,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });

      // Procesar OCR del comprobante
      let datosOcr: DatosTransaccionOCR = { nroOrden: '', nroDocumento: '' };
      try {
        datosOcr = await extraerDatosComprobante(req.file.path);
        console.log('[OCR] Datos extraídos:', datosOcr);
      } catch (ocrError) {
        console.warn('[OCR] Advertencia en extracción OCR, continuando sin datos extraídos:', ocrError);
        // No lanzar error, continuar con datos vacíos
      }
      
      // Generar ruta segura para almacenar el comprobante temporalmente
      const ext = path.extname(req.file.originalname);
      const nombreArchivoSeguro = `comprobante_${Date.now()}${ext}`;
      
      // Crear directorio en la carpeta pública del frontend
      const targetDir = path.resolve(process.cwd(), '../frontend/public/comprobantes');
      
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
        console.log('[OCR] Directorio creado:', targetDir);
      }

      const rutaDestino = path.join(targetDir, nombreArchivoSeguro);
      
      // Usar copyFileSync y unlinkSync para evitar el error EXDEV entre volúmenes Docker diferentes
      fs.copyFileSync(req.file.path, rutaDestino);
      fs.unlinkSync(req.file.path);
      console.log('[OCR] Archivo guardado en:', rutaDestino);

      // URL pública para el comprobante (relativa al frontend)
      const comprobanteUrl = `/comprobantes/${nombreArchivoSeguro}`;

      console.log('[OCR] Respuesta exitosa:', {
        codigoTransaccion: datosOcr.nroOrden || datosOcr.nroDocumento || '',
        comprobanteUrl
      });

      res.status(200).json({
        codigoTransaccion: datosOcr.nroOrden || datosOcr.nroDocumento || '',
        comprobanteUrl: comprobanteUrl,
        datosOcr: datosOcr,
        message: 'Comprobante procesado correctamente'
      });
    } catch (error) {
      console.error('[OCR] Error al procesar comprobante:', error);
      
      // Limpiar archivo temporal en caso de error
      if (req.file && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
          console.log('[OCR] Archivo temporal eliminado');
        } catch (deleteError) {
          console.error('[OCR] Error al eliminar archivo temporal:', deleteError);
        }
      }
      
      res.status(500).json({ 
        error: 'Error al procesar el comprobante. Por favor intente nuevamente.',
        details: (error as any)?.message || 'Error desconocido'
      });
    }
  },

  async eliminar(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const participante = await prisma.eventoParticipante.findUnique({
        where: { id },
      });

      if (!participante) {
        res.status(404).json({ error: 'Participante no encontrado.' });
        return;
      }

      // Si posee un comprobante local guardado, intentar eliminar el archivo físico de manera segura
      if (participante.comprobanteUrl && participante.comprobanteUrl.startsWith('/frontend/media/')) {
        try {
          const relativePath = participante.comprobanteUrl.replace('/frontend/', '../frontend/');
          const absolutePath = path.resolve(process.cwd(), relativePath);
          if (fs.existsSync(absolutePath)) {
            fs.unlinkSync(absolutePath);
          }
        } catch (fileErr) {
          console.warn(`[ELIMINAR] No se pudo eliminar el archivo físico del comprobante para el participante ${id}:`, fileErr);
        }
      }

      await prisma.eventoParticipante.delete({
        where: { id },
      });

      res.status(200).json({ message: 'Participante eliminado exitosamente.' });
    } catch (error: any) {
      if (error?.code === 'P2025') {
        res.status(404).json({ error: 'El registro del participante no existe.' });
        return;
      }
      if (error?.code === 'P2003') {
        res.status(400).json({ error: 'No se puede eliminar el participante porque posee registros vinculados.' });
        return;
      }
      console.error(`Error al eliminar participante ${req.params.id}:`, error);
      res.status(500).json({ error: 'Error al eliminar el participante de la base de datos.' });
    }
  }
};

