import { NextFunction, Request, Response } from 'express';
import { unlockService } from '../services/unlock.service.js';
import { AppError } from '../utils/appError.js';

export class UnlockController {
  async registrar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const datos = await unlockService.registrarDispositivo({
        codigoPatrimonial: req.body.codigoPatrimonial,
        laboratorioId: req.body.laboratorioId !== undefined ? Number(req.body.laboratorioId) : Number.NaN,
        nombreEquipo: req.body.nombreEquipo ? String(req.body.nombreEquipo) : undefined,
      });

      res.status(201).json({
        status: 'success',
        message: 'Dispositivo de escritorio vinculado al equipo correctamente.',
        data: datos,
      });
    } catch (error) {
      next(error);
    }
  }

  async bloquear(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deviceToken = req.headers['x-device-token'];
      if (!deviceToken) {
        throw new AppError('Debe enviar el token del dispositivo en el encabezado x-device-token.', 401);
      }

      const datos = await unlockService.bloquear(String(deviceToken));

      res.status(201).json({
        status: 'success',
        message: 'Equipo bloqueado. Código de desbloqueo generado.',
        data: datos,
      });
    } catch (error) {
      next(error);
    }
  }

  async consultar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const deviceToken = req.headers['x-device-token'];
      if (!deviceToken) {
        throw new AppError('Debe enviar el token del dispositivo en el encabezado x-device-token.', 401);
      }

      const desafioId = Number(req.params.desafioId);
      if (Number.isNaN(desafioId)) {
        throw new AppError('El parámetro desafioId debe ser un número.', 400);
      }

      const datos = await unlockService.consultarDesafio(String(deviceToken), desafioId);

      res.status(200).json({ status: 'success', data: datos });
    } catch (error) {
      next(error);
    }
  }

  async liberar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const usuarioId = req.user?.id ? Number(req.user.id) : Number.NaN;
      if (!usuarioId || Number.isNaN(usuarioId)) {
        throw new AppError('Debe iniciar sesión para desbloquear un equipo.', 401);
      }

      const laboratorioId =
        req.body.laboratorioId !== undefined ? Number(req.body.laboratorioId) : undefined;

      const datos = await unlockService.liberar(String(req.body.codigo ?? ''), usuarioId, laboratorioId);

      res.status(200).json({
        status: 'success',
        message: 'Equipo desbloqueado. Uso efectivo registrado.',
        data: datos,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const unlockController = new UnlockController();