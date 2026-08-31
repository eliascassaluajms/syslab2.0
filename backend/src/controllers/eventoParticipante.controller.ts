import { Request, Response } from 'express';
import { EstadoInscripcion } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import { prisma } from '../config/prisma.js';
import { extraerDatosComprobante } from '../services/ocr.service.js';

export const EventoParticipanteController = {
  async crear(req: Request, res: Response): Promise<void> {
    try {
      const { nombre, apellido, correo, telefono, tipo, activityId, codigoTransaccion, observaciones } = req.body;

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
      const { nombre, apellido, correo, telefono, tipo, codigoTransaccion } = req.body;

      const participanteActualizado = await prisma.eventoParticipante.update({
        where: { id },
        data: {
          ...(nombre && { nombre }),
          ...(apellido && { apellido }),
          ...(correo && { correo }),
          ...(telefono !== undefined && { telefono }),
          ...(tipo && { tipo }),
          ...(codigoTransaccion !== undefined && { codigoTransaccion }),
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
          activity: {
            include: { event: true }
          }
        }
      });

      if (!participante) {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(404).json({ error: 'Participante no encontrado.' });
        return;
      }

      // Nombre del evento para la carpeta
      const nombreEventoCrudo = participante.activity?.event?.nombre || participante.activity?.title || 'evento_general';
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

      // Trasladar archivo desde temporal a la ruta definitiva
      fs.renameSync(req.file.path, rutaDestinoFinal);

      // URL pública para el frontend
      const comprobanteUrl = `/frontend/media/imagenes/${nombreEventoSeguro}/${nombreArchivoFinal}`;

      // Procesar OCR
      const datosOcr = await extraerDatosComprobante(rutaDestinoFinal);

      const participanteActualizado = await prisma.eventoParticipante.update({
        where: { id },
        data: {
          comprobanteUrl,
          codigoTransaccion: datosOcr.nroOrden || participante.codigoTransaccion,
          estado: EstadoInscripcion.PENDIENTE
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

      await prisma.eventoParticipante.delete({
        where: { id },
      });

      res.status(200).json({ message: 'Participante eliminado correctamente.' });
    } catch (error) {
      console.error(`Error al eliminar participante ${req.params.id}:`, error);
      res.status(500).json({ error: 'Error al eliminar el registro del participante.' });
    }
  }
};
