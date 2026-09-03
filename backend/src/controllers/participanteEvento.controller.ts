import { Request, Response, NextFunction } from 'express';
import { ParticipanteEventoService } from '../services/participanteEvento.service.js';

export class ParticipanteEventoController {
  /**
   * Preinscripción de un participante desde la Landing Page
   */
  static async registrar(req: Request, res: Response, next: NextFunction) {
    try {
      const nuevoParticipante = await ParticipanteEventoService.registrar(req.body);
      return res.status(201).json({
        success: true,
        message: 'Preinscripción realizada con éxito. Pendiente de verificación de pago.',
        data: nuevoParticipante,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualización rápida de datos (Nombres, Correo, Teléfono) por el operador en caja
   */
  static async actualizarDatos(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const participanteActualizado = await ParticipanteEventoService.actualizar(String(id), req.body);
      return res.status(200).json({
        success: true,
        message: 'Datos del participante actualizados correctamente.',
        data: participanteActualizado,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Validación y cambio de estado de pago (PAGO_VERIFICADO / RECHAZADO)
   */
  static async validarPago(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { estado, observaciones } = req.body;

      if (!estado) {
        return res.status(400).json({
          success: false,
          message: 'El campo "estado" es obligatorio para validar el pago.',
        });
      }

      const resultado = await ParticipanteEventoService.cambiarEstadoPago(
        String(id),
        estado,
        observaciones
      );

      return res.status(200).json({
        success: true,
        message: 'Estado de pago actualizado correctamente.',
        data: resultado,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Consulta individual por ID de participante
   */
  static async obtenerPorId(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const participante = await ParticipanteEventoService.obtenerPorId(String(id));
      
      if (!participante) {
        return res.status(404).json({
          success: false,
          message: 'Participante no encontrado.',
        });
      }

      return res.status(200).json({
        success: true,
        data: participante,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Listado general de participantes para el panel administrativo / caja
   */
  static async listar(req: Request, res: Response, next: NextFunction) {
    try {
      const participantes = await ParticipanteEventoService.listarParticipantes();
      return res.status(200).json({
        success: true,
        data: participantes,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Configuración bancaria/QR activa para mostrar en el modal de pago
   */
  static async getConfiguracionPago(_req: Request, res: Response, next: NextFunction) {
    try {
      const config = await ParticipanteEventoService.obtenerConfiguracionPago();
      return res.status(200).json({
        success: true,
        data: config,
      });
    } catch (error) {
      next(error);
    }
  }
}
