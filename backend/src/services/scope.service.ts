import { prisma } from '../config/prisma.js';

export class ScopeService {
  /**
   * Resuelve jerárquicamente las carreras accesibles por un usuario según su ámbito.
   * @param ambitoId El ID numérico del registro de ámbito (Carrera o Facultad) del usuario
   * @param tipo 'FACULTAD' | 'CARRERA'
   */
  static async resolverCarrerasPorAmbito(ambitoId: number, tipo: 'FACULTAD' | 'CARRERA'): Promise<number[]> {
    if (tipo === 'CARRERA') {
      // Si el ámbito ya es por carrera, el acceso es directo a ese ID único numérico
      return [ambitoId];
    }

    if (tipo === 'FACULTAD') {
      // Si el ámbito es de Facultad, consultamos la BD para extraer todas sus carreras asociadas
      const carreras = await prisma.carrera.findMany({
        where: { 
          facultadId: ambitoId // Ahora coincide perfectamente con el tipo 'number' esperado por Prisma
        },
        select: { 
          id: true 
        }
      });
      
      // Retornamos un arreglo plano de enteros (number[]) con los IDs de las carreras
      return carreras.map(c => c.id);
    }

    return [];
  }
}