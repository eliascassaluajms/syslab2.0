import { Request, Response, NextFunction } from 'express';
import { ParticipanteEventoService } from '../services/participanteEvento.service';

export class ParticipanteEventoController {
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

  static async getConfiguracionPago(req: Request, res: Response, next: NextFunction) {
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
}
