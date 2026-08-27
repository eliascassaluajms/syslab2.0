import { prisma } from '../config/prisma.js';
import { TipoCategoriaEvento, Prisma } from '@prisma/client';

export class CategoriaEventoRepository {
  /**
   * Listar categorías asociadas a una carrera
   */
  static async listarPorCarrera(carreraId: number, tipo?: TipoCategoriaEvento) {
    return await prisma.categoriaEvento.findMany({
      where: {
        carreraId,
        ...(tipo && { tipo }),
      },
      orderBy: { nombre: 'asc' },
    });
  }

  /**
   * Buscar categoría por ID y su ámbito de carrera
   */
  static async buscarPorIdYCarrera(id: number, carreraId: number) {
    return await prisma.categoriaEvento.findFirst({
      where: { id, carreraId },
    });
  }

  /**
   * Verificar existencia de nombre duplicado dentro de una misma carrera
   */
  static async buscarPorNombreYCarrera(nombre: string, carreraId: number, idExcluido?: number) {
    return await prisma.categoriaEvento.findFirst({
      where: {
        carreraId,
        nombre: { equals: nombre, mode: 'insensitive' },
        ...(idExcluido && { NOT: { id: idExcluido } }),
      },
    });
  }

  /**
   * Insertar una nueva categoría
   */
  static async crear(datos: Prisma.CategoriaEventoCreateInput) {
    return await prisma.categoriaEvento.create({ data: datos });
  }

  /**
   * Actualizar registro de categoría
   */
  static async actualizar(id: number, datos: Prisma.CategoriaEventoUpdateInput) {
    return await prisma.categoriaEvento.update({
      where: { id },
      data: datos,
    });
  }

  /**
   * Eliminar categoría por ID
   */
  static async eliminar(id: number) {
    return await prisma.categoriaEvento.delete({
      where: { id },
    });
  }
}
