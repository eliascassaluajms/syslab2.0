import { Request, Response, NextFunction } from 'express';
import { EstadoInscripcion } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import Tesseract from 'tesseract.js';
import { prisma } from '../config/prisma.js';
import { extraerDatosComprobante, OcrParserService, DatosTransaccionOCR, ocrService } from '../services/ocr.service.js';

// Diccionario de términos bancarios comunes en Bolivia
const TERMINOS_BANCARIOS = [
  'transferencia', 'comprobante', 'transaccion', 'operacion', 'monto',
  'importe', 'bs', 'bob', 'banco', 'union', 'bnb', 'bcp', 'mercantil',
  'ganadero', 'fie', 'qr', 'cuenta', 'origen', 'destino', 'exitoso'
];

export const EventoParticipanteController = {
  async crear(req: Request, res: Response): Promise<void> {
    try {
      const { honeypot, formStartTime, nombre, apellido, correo, telefono, tipo, activityId, codigoTransaccion, montoPagado, comprobanteUrl, observaciones } = req.body;

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

      const codigoLimpio = String(codigoTransaccion).trim();
      const transaccionExistente = await prisma.eventoParticipante.findFirst({
        where: {
          codigoTransaccion: codigoLimpio,
          estado: { in: ['PRE_INSCRITO', 'PAGO_VERIFICADO', 'ASISTENCIA_CONFIRMADA'] },
        },
      });
      if (transaccionExistente) {
        res.status(409).json({
          message: `El N° de transacción ${codigoLimpio} ya fue registrado previamente en el sistema.`,
        });
        return;
      }

      const tipoNormalizado = tipo === 'PROFESIONAL' ? 'PROFESIONAL' : 'ESTUDIANTE';

      let comprobanteUrlLimpia = comprobanteUrl;
      if (typeof comprobanteUrlLimpia === 'string') {
        comprobanteUrlLimpia = comprobanteUrlLimpia.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, '');
        if (comprobanteUrlLimpia && !comprobanteUrlLimpia.startsWith('/') && !comprobanteUrlLimpia.startsWith('http')) {
          comprobanteUrlLimpia = `/${comprobanteUrlLimpia}`;
        }
      }

      const participanteCreado = await prisma.eventoParticipante.create({
        data: {
          nombre,
          apellido,
          correo,
          telefono,
          tipo: tipoNormalizado,
          activityId: String(activityId),
          codigoTransaccion: codigoLimpio,
          montoPagado: Number(montoPagado) || 0,
          ...(comprobanteUrlLimpia && { comprobanteUrl: comprobanteUrlLimpia }),
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
      const { nombre, apellido, correo, telefono, tipo, estado, codigoTransaccion, comprobanteUrl, observaciones } = req.body;

      if (!Object.values(EstadoInscripcion).includes(estado as EstadoInscripcion) && estado !== undefined) {
        res.status(400).json({ error: 'El estado especificado no es válido.' });
        return;
      }

      let comprobanteUrlLimpia = comprobanteUrl;
      if (typeof comprobanteUrlLimpia === 'string') {
        comprobanteUrlLimpia = comprobanteUrlLimpia.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, '');
        if (comprobanteUrlLimpia && !comprobanteUrlLimpia.startsWith('/') && !comprobanteUrlLimpia.startsWith('http')) {
          comprobanteUrlLimpia = `/${comprobanteUrlLimpia}`;
        }
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
          ...(comprobanteUrlLimpia !== undefined && { comprobanteUrl: comprobanteUrlLimpia }),
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

  async procesarComprobanteOCR(req: Request, res: Response, next?: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'No se proporcionó ningún archivo de comprobante.' });
        return;
      }

      const buffer = req.file.buffer || (req.file.path && fs.existsSync(req.file.path) ? fs.readFileSync(req.file.path) : null);
      if (!buffer) {
        res.status(400).json({ error: 'No se pudo leer la imagen del comprobante.' });
        return;
      }

      // 1. Analizar directamente el buffer en memoria (RAM)
      const resultadoOCR = await ocrService.analizarBuffer(buffer);
      const textoLimpio = (resultadoOCR.textoCompleto || '').toLowerCase();

      // 2. Comprobar coincidencias con términos bancarios
      const coincidencias = TERMINOS_BANCARIOS.filter((termino) =>
        textoLimpio.includes(termino)
      );

      // Si no detecta transaccion NI al menos 2 términos bancarios, se rechaza
      const pareceComprobante = Boolean(
        resultadoOCR.codigoTransaccion || coincidencias.length >= 2
      );

      if (!pareceComprobante) {
        if (req.file.path && fs.existsSync(req.file.path)) {
          try { fs.unlinkSync(req.file.path); } catch (e) {}
        }
        // El buffer se desecha automáticamente sin tocar el disco
        res.status(422).json({
          status: 'fail',
          valido: false,
          message: 'La imagen subida no parece ser un comprobante o voucher bancario legible. Puedes intentar con otra foto o registrar el número manualmente.',
        });
        return;
      }

      // 3. Si superó el filtro, se persiste físicamente en el disco
      const uploadDir = path.join(process.cwd(), 'uploads', 'comprobantes');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const extension = path.extname(req.file.originalname) || '.jpeg';
      const filename = `comprobante_${Date.now()}${extension}`;
      const targetPath = path.join(uploadDir, filename);

      fs.writeFileSync(targetPath, buffer);

      // Copia adicional a frontend/public/comprobantes por retrocompatibilidad
      try {
        const frontendDir = path.resolve(process.cwd(), '../frontend/public/comprobantes');
        if (!fs.existsSync(frontendDir)) fs.mkdirSync(frontendDir, { recursive: true });
        fs.writeFileSync(path.join(frontendDir, filename), buffer);
      } catch (fErr) {
        // Ignorar si el frontend no está montado en la misma jerarquía
      }

      if (req.file.path && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch (e) {}
      }

      const comprobanteUrl = `/comprobantes/${filename}`;

      res.status(200).json({
        status: 'success',
        valido: true,
        data: {
          codigoTransaccion: resultadoOCR.codigoTransaccion || '',
          monto: resultadoOCR.monto || null,
          comprobanteUrl,
        },
        codigoTransaccion: resultadoOCR.codigoTransaccion || '',
        monto: resultadoOCR.monto || null,
        comprobanteUrl,
        datosOcr: resultadoOCR,
        message: 'Comprobante procesado correctamente'
      });
    } catch (error) {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch (e) {}
      }
      console.error('[OCR] Error al procesar comprobante:', error);
      if (next) {
        next(error);
      } else {
        res.status(500).json({
          error: 'Error al procesar el comprobante. Por favor intente nuevamente.',
          details: (error as any)?.message || 'Error desconocido'
        });
      }
    }
  },

  async procesarOCR(req: Request, res: Response, next?: NextFunction): Promise<void> {
    return this.procesarComprobanteOCR(req, res, next);
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
  },

  async matricularManual(req: Request, res: Response): Promise<void> {
    try {
      const { nombre, apellido, correo, telefono, tipo, activityId, codigoTransaccion, estadoPago, observaciones } = req.body;

      if (!nombre || !apellido || !correo || !activityId) {
        res.status(400).json({ error: 'Nombres, apellidos, correo y la actividad son campos requeridos.' });
        return;
      }

      const tipoNormalizado = tipo === 'PROFESIONAL' ? 'PROFESIONAL' : 'ESTUDIANTE';
      const estadoDefinido = (estadoPago || 'PAGO_VERIFICADO') as EstadoInscripcion;

      const participanteCreado = await prisma.eventoParticipante.create({
        data: {
          nombre,
          apellido,
          correo,
          telefono: telefono || '',
          tipo: tipoNormalizado,
          activityId: String(activityId),
          codigoTransaccion: codigoTransaccion || `MANUAL-${Date.now()}`,
          estado: estadoDefinido,
          observaciones: observaciones || 'Matriculación manual por admin',
        },
        include: {
          activity: { select: { id: true, title: true } },
        },
      });

      res.status(201).json(participanteCreado);
    } catch (error: any) {
      if (error?.code === 'P2002') {
        res.status(400).json({ error: 'Ya existe una inscripción registrada con ese correo para esta actividad.' });
        return;
      }
      console.error('Error al matricular manualmente:', error);
      res.status(500).json({ error: 'Error al procesar la matriculación manual.' });
    }
  },

  async listarVerificadosPorActividad(req: Request, res: Response): Promise<void> {
    try {
      const { activityId } = req.params;

      if (!activityId) {
        res.status(400).json({ error: 'El ID de la actividad es requerido.' });
        return;
      }

      const verificados = await prisma.eventoParticipante.findMany({
        where: {
          activityId: String(activityId),
          estado: EstadoInscripcion.PAGO_VERIFICADO,
        },
        include: {
          activity: { select: { id: true, title: true } },
        },
        orderBy: [
          { apellido: 'asc' },
          { nombre: 'asc' },
        ],
      });

      res.status(200).json(verificados);
    } catch (error) {
      console.error(`Error al listar verificados para actividad ${req.params.activityId}:`, error);
      res.status(500).json({ error: 'Error al obtener la lista de participantes verificados.' });
    }
  }
};

