import { IJwtPayload } from '../interfaces/auth.interface.js';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string | number;
        nombre: string;
        correo: string;
        rol: string;
        roles?: string[];
        esGlobal: boolean;
        permisos: string[];
        carreras: number[]; // IDs planos numéricos del schema.prisma
        carreraId?: number;
        facultadId?: number;
      };
      targetCarreraId?: number; // Inyectado por la inspección polimórfica (KAN-16.2)
    }
  }
}