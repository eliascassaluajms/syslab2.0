import { prisma } from '../config/prisma.js';

export interface ScopeFilter {
  facultadId?: number;
  carreraId?: number;
}

export class AuthorizationService {
  async tienePermiso(
    usuarioId: number,
    codigoPermiso: string,
    scope?: ScopeFilter
  ): Promise<boolean> {
    // 1. Verificar si el usuario tiene acceso Global (SuperAdmin)
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: { esGlobal: true, activo: true },
    });

    if (!usuario || !usuario.activo) return false;
    if (usuario.esGlobal) return true; // Bypass directo si es Admin Global

    const { facultadId, carreraId } = scope || {};

    const condicionesAmbito: Array<object> = [{ facultadId: null, carreraId: null }];

    if (facultadId) condicionesAmbito.push({ facultadId, carreraId: null });
    if (carreraId) condicionesAmbito.push({ carreraId });

    const asignacion = await prisma.asignacionAmbito.findFirst({
      where: {
        usuarioId,
        rol: {
          activo: true,
          rolPermisos: {
            some: {
              permiso: { codigo: codigoPermiso },
            },
          },
        },
        OR: condicionesAmbito,
      },
    });

    return !!asignacion;
  }
}

export const authorizationService = new AuthorizationService();