import { Request, Response } from 'express';
import { EstadoInscripcion } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import Tesseract from 'tesseract.js';
import { prisma } from '../config/prisma.js';
import { extraerDatosComprobante, OcrParserService, DatosTransaccionOCR } from '../services/ocr.service.js';

export const EventoParticipanteController = {
  async crear(req: Request, res: Response): Promise<void> {
    try {
      const { honeypot, formStartTime, nombre, apellido, correo, telefono, tipo, activityId, codigoTransaccion, comprobanteUrl, observaciones } = req.body;

      // 1. Detección Honeypot: si el campo trampa tiene contenido, es un bot
      if (honeypot && typeof honeypot === 'string' && honeypot.trim() !== '') {
        // Responde con 200 ficticio para engañar al bot sin procesar nada
        res.status(200).json({ status: 'success', message: 'Preinscripción registrada correctamente.' });
        return;
      }

      // 2. Detección por tiempo: un humano tarda al menos 2.5 segundos en interactuar
      if (formStartTime) {
        const tiempoTranscurrido = (Date.now() - Number(formStartTime)) / 1000;
        if (tiempoTranscurrido < 2.5) {
          res.status(403).json({ message: 'Solicitud bloqueada por comportamiento automatizado.' });
          return;
        }
      }

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

      // 1. Extraer texto mediante OCR Tesseract
      let textoOCR = '';
      let datosOcrLegacy: DatosTransaccionOCR = {};
      try {
        const { data: { text } } = await Tesseract.recognize(req.file.path, 'spa', { logger: () => {} });
        textoOCR = text || '';
        datosOcrLegacy = await extraerDatosComprobante(req.file.path);
        console.log('[OCR] Texto extraído exitosamente. Longitud:', textoOCR.length);
      } catch (ocrError) {
        console.warn('[OCR] Advertencia en extracción OCR:', ocrError);
      }

      // 2. Definir ruta accesible en uploads/comprobantes del Backend
      const ext = path.extname(req.file.originalname);
      const nombreArchivoSeguro = `comprobante_${Date.now()}${ext}`;
      
      const uploadDir = path.join(process.cwd(), 'uploads', 'comprobantes');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log('[OCR] Directorio creado:', uploadDir);
      }

      const rutaDestino = path.join(uploadDir, nombreArchivoSeguro);
      fs.copyFileSync(req.file.path, rutaDestino);

      // Copia adicional a frontend/public/comprobantes por retrocompatibilidad
      try {
        const frontendDir = path.resolve(process.cwd(), '../frontend/public/comprobantes');
        if (!fs.existsSync(frontendDir)) fs.mkdirSync(frontendDir, { recursive: true });
        fs.copyFileSync(req.file.path, path.join(frontendDir, nombreArchivoSeguro));
      } catch (fErr) {
        // Ignorar si el frontend no está montado en la misma jerarquía
      }

      fs.unlinkSync(req.file.path);
      console.log('[OCR] Archivo guardado en:', rutaDestino);

      // URL accesible
      const comprobanteUrl = `/api/comprobantes/${nombreArchivoSeguro}`;

      // 3. Procesar datos del texto OCR
      const resultado = OcrParserService.procesarTexto(textoOCR, comprobanteUrl);
      if (!resultado.codigoTransaccion && (datosOcrLegacy.nroOrden || datosOcrLegacy.nroDocumento)) {
        resultado.codigoTransaccion = datosOcrLegacy.nroOrden || datosOcrLegacy.nroDocumento || null;
      }
      if (resultado.monto === null && datosOcrLegacy.monto) {
        const parsed = parseFloat(datosOcrLegacy.monto);
        if (!isNaN(parsed)) resultado.monto = parsed;
      }

      console.log('[OCR] Respuesta exitosa:', {
        codigoTransaccion: resultado.codigoTransaccion,
        monto: resultado.monto,
        comprobanteUrl: resultado.comprobanteUrl,
      });

      res.status(200).json({
        status: 'success',
        data: {
          codigoTransaccion: resultado.codigoTransaccion,
          monto: resultado.monto,
          comprobanteUrl: resultado.comprobanteUrl,
          valido: Boolean(resultado.codigoTransaccion && resultado.monto),
        },
        codigoTransaccion: resultado.codigoTransaccion || '',
        monto: resultado.monto,
        comprobanteUrl: resultado.comprobanteUrl,
        datosOcr: resultado,
        message: 'Comprobante procesado correctamente'
      });
    } catch (error) {
      console.error('[OCR] Error al procesar comprobante:', error);
      
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

