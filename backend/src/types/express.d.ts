import { IJwtPayload } from '../interfaces/auth.interface.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        nombre: string;
        correo: string;
        rol: string;
        permisos: string[];
        carreras: number[]; // IDs planos numéricos del schema.prisma
      };
      targetCarreraId?: number; // Inyectado por la inspección polimórfica (KAN-16.2)
    }
  }
}