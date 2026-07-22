import { prisma } from '../config/prisma.js';

export interface ScopeFilter {
  facultadId?: number;
  carreraId?: number;
}

export class AuthorizationService {
  /**
   * Verifica dinámicamente en BD si el usuario posee un permiso específico
   * dentro del ámbito (Facultad/Carrera) especificado.
   */
  async tienePermiso(
    usuarioId: number,
    codigoPermiso: string,
    scope?: ScopeFilter
  ): Promise<boolean> {
    const { facultadId, carreraId } = scope || {};

    // Construcción de condiciones de ámbito (Jerarquía de permisos)
    const condicionesAmbito: Array<object> = [
      // 1. Permiso otorgado a nivel GLOBAL (Sin restricción de facultad ni carrera)
      { facultadId: null, carreraId: null }
    ];

    if (facultadId) {
      // 2. Permiso otorgado a nivel de la FACULTAD especificada
      condicionesAmbito.push({ facultadId, carreraId: null });
    }

    if (carreraId) {
      // 3. Permiso otorgado a nivel de la CARRERA especificada
      condicionesAmbito.push({ carreraId });
    }

    // Consulta relacional directa en la capa de persistencia
    const asignacion = await prisma.asignacionAmbito.findFirst({
      where: {
        usuarioId,
        usuario: { activo: true },
        rol: {
          rolPermisos: {
            some: {
              permiso: {
                codigo: codigoPermiso,
              },
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