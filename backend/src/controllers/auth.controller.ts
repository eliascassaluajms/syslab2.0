import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service.js';
import { AppError } from '../utils/appError.js';

export class AuthController {
  /**
   * Maneja el endpoint público de autenticación.
   * Valida la entrada, invoca el servicio y emite el token estructurado.
   */
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { correo, password } = req.body;

      // 1. Validación estructural de la petición (Fail Fast)
      if (!correo || !password) {
        throw new AppError('Por favor, proporcione el correo y la contraseña.', 400);
      }

      // 2. Invocar la capa de servicio (Procesa criptografía y ámbitos - KAN-13)
      const { token, usuario } = await authService.login(correo, password);

      // 3. Emisión de respuesta Stateless limpia
      res.status(200).json({
        status: 'success',
        token,
        data: {
          usuario
        }
      });
    } catch (error) {
      // 4. Delegar limpiamente al Middleware centralizado (KAN-11)
      next(error);
    }
  }
}

export const authController = new AuthController();