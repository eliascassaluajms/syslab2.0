import { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';

export class IncidenciasRepository {
  /**
   * Obtiene la lista de incidencias aplicando filtros de ámbito o parámetros de búsqueda.
   */
  async findAll(whereCondition: Prisma.IncidenciaWhereInput = {}) {
    return await prisma.incidencia.findMany({
      where: whereCondition,
      include: {
        laboratorio: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
            facultadId: true,
            carreraId: true,
          },
        },
        solicitante: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            correo: true,
          },
        },
        tecnicoAsignado: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            correo: true,
          },
        },
        equipo: {
          select: {
            id: true,
            nombre: true,
            codigoPatrimonial: true,
            estado: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Obtiene una incidencia específica por su ID numérico.
   */
  async findById(id: number) {
    return await prisma.incidencia.findUnique({
      where: { id },
      include: {
        laboratorio: {
          include: {
            facultad: true,
            carrera: true,
          },
        },
        solicitante: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            correo: true,
          },
        },
        tecnicoAsignado: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            correo: true,
          },
        },
        equipo: true,
      },
    });
  }

  /**
   * Crea un nuevo registro de incidencia.
   */
  async create(data: Prisma.IncidenciaUncheckedCreateInput) {
    return await prisma.incidencia.create({
      data,
      include: {
        laboratorio: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
          },
        },
        solicitante: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            correo: true,
          },
        },
        equipo: {
          select: {
            id: true,
            nombre: true,
            codigoPatrimonial: true,
            estado: true,
          },
        },
      },
    });
  }

  /**
   * Actualiza los datos de una incidencia existente.
   */
  async update(id: number, data: Prisma.IncidenciaUncheckedUpdateInput) {
    return await prisma.incidencia.update({
      where: { id },
      data,
      include: {
        laboratorio: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
          },
        },
        solicitante: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            correo: true,
          },
        },
        tecnicoAsignado: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            correo: true,
          },
        },
        equipo: true,
      },
    });
  }

  /**
   * Elimina una incidencia por su ID.
   */
  async delete(id: number) {
    return await prisma.incidencia.delete({
      where: { id },
    });
  }
}

export const incidenciasRepository = new IncidenciasRepository();
