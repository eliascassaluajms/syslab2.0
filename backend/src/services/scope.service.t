import { prisma } from '../config/prisma.js';

export class ScopeService {
  /**
   * Resuelve jerárquicamente las carreras accesibles por un usuario según su ámbito.
   * @param ambitoId El ID del registro de ámbito/permiso del usuario
   * @param tipo 'FACULTAD' | 'CARRERA'
   */
  static async resolverCarrerasPorAmbito(ambitoId: string, tipo: 'FACULTAD' | 'CARRERA'): Promise<string[]> {
    if (tipo === 'CARRERA') {
      // Si el ámbito ya es por carrera, el acceso es directo a ese ID único
      return [ambitoId];
    }

    if (tipo === 'FACULTAD') {
      // Si el ámbito es de Facultad, consultamos la BD para extraer todas sus carreras
      const carreras = await prisma.carrera.findMany({
        where: { facultadId: ambitoId },
        select: { id: true }
      });
      
      // Retornamos un arreglo plano de strings con los IDs de las carreras
      return carreras.map(c => c.id);
    }

    return [];
  }
}