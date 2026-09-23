import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { AppError } from '../utils/appError.js';

export class AuthController {
  /**
   * Maneja el endpoint público de autenticación.
   * Valida la entrada, invoca el servicio y emite Access Token + Refresh Token rotativo.
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { correo, password, ru, usuario: ruUsuario, username } = req.body;
      const identificador = correo || ru || ruUsuario || username;

      if (!identificador || !password) {
        throw new AppError('Por favor, proporcione su correo o Registro Universitario y la contraseña.', 400);
      }

      const dispositivoInfo = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'].slice(0, 255) : undefined;
      const { token, refreshToken, usuario } = await authService.login(identificador, password, { dispositivoInfo });

      res.status(200).json({
        status: 'success',
        token,
        refreshToken,
        data: {
          usuario,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Autenticación exclusiva para la aplicación del personal docente.
   * Rechaza con 403 a estudiantes u otros roles no docentes.
   */
  async loginDocente(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { correo, password, ru, usuario: ruUsuario, username } = req.body;
      const identificador = correo || ru || ruUsuario || username;

      if (!identificador || !password) {
        throw new AppError('Por favor, proporcione su correo o Registro Universitario y la contraseña.', 400);
      }

      const dispositivoInfo = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'].slice(0, 255) : undefined;
      const { token, refreshToken, usuario } = await authService.login(identificador, password, {
        exigirRolesDocentes: true,
        dispositivoInfo,
      });

      res.status(200).json({
        status: 'success',
        token,
        refreshToken,
        data: {
          usuario,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Renovación de sesión con rotación estricta de Refresh Token.
   */
  async refrescarToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.body.refreshToken || (req.headers['x-refresh-token'] as string | undefined);

      if (!refreshToken) {
        throw new AppError('Token de actualización no proporcionado.', 400);
      }

      const dispositivoInfo = typeof req.headers['user-agent'] === 'string' ? req.headers['user-agent'].slice(0, 255) : undefined;
      const { token, refreshToken: nuevoRefreshToken, usuario } = await authService.refrescarToken(refreshToken, dispositivoInfo);

      res.status(200).json({
        status: 'success',
        token,
        refreshToken: nuevoRefreshToken,
        data: {
          usuario,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Cierre de sesión e invalidación del Refresh Token.
   */
  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.body?.refreshToken || (req.headers['x-refresh-token'] as string | undefined);
      await authService.logout(refreshToken);

      res.status(200).json({
        status: 'success',
        message: 'Sesión cerrada exitosamente.',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();