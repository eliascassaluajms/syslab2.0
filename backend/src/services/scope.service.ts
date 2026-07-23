import { prisma } from '../config/prisma.js';

export class ScopeService {
  /**
   * Resuelve de forma consolidada todas las carreras accesibles por un usuario.
   */
  static async obtenerCarrerasAccesiblesPorUsuario(usuarioId: number): Promise<number[]> {
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      include: {
        asignacionesRoles: {
          include: {
            facultad: {
              include: { carreras: { where: { activo: true }, select: { id: true } } },
            },
          },
        },
      },
    });

    if (!usuario || !usuario.activo) return [];

    if (usuario.esGlobal) {
      const todasLasCarreras = await prisma.carrera.findMany({
        where: { activo: true },
        select: { id: true },
      });
      return todasLasCarreras.map((c) => c.id);
    }

    const carrerasSet = new Set<number>();

    usuario.asignacionesRoles.forEach((asig) => {
      if (asig.carreraId) {
        carrerasSet.add(asig.carreraId);
      }
      if (asig.facultadId && asig.facultad?.carreras) {
        asig.facultad.carreras.forEach((c) => carrerasSet.add(c.id));
      }
    });

    return Array.from(carrerasSet);
  }

  /**
   * Método de retrocompatibilidad para controladores existentes (Laboratorios, etc.)
   */
  static async resolverCarrerasPorAmbito(ambitoId: number, tipo: 'FACULTAD' | 'CARRERA'): Promise<number[]> {
    if (tipo === 'CARRERA') {
      return [ambitoId];
    }

    if (tipo === 'FACULTAD') {
      const carreras = await prisma.carrera.findMany({
        where: { facultadId: ambitoId, activo: true },
        select: { id: true },
      });
      return carreras.map((c) => c.id);
    }

    return [];
  }
}