import { prisma } from '../config/prisma.js';
import { TipoCategoriaEvento, Prisma } from '@prisma/client';

export class CategoriaEventoRepository {
  /**
   * Listar categorías (globales o filtradas si se provee carreraId)
   */
  static async listarPorCarrera(carreraId?: number, tipo?: TipoCategoriaEvento) {
    return await prisma.categoriaEvento.findMany({
      where: {
        ...(carreraId && carreraId > 0 ? { carreraId } : {}),
        ...(tipo && { tipo }),
      },
      orderBy: { nombre: 'asc' },
    });
  }

  /**
   * Buscar categoría por ID permitiendo bypass de carrera si es global
   */
  static async buscarPorIdYCarrera(id: number, carreraId?: number) {
    return await prisma.categoriaEvento.findFirst({
      where: {
        id,
        ...(carreraId && carreraId > 0 ? { carreraId } : {}),
      },
    });
  }

  /**
   * Verificar existencia de nombre duplicado de manera global o por carrera
   */
  static async buscarPorNombreYCarrera(nombre: string, carreraId?: number, idExcluido?: number) {
    return await prisma.categoriaEvento.findFirst({
      where: {
        ...(carreraId && carreraId > 0 ? { carreraId } : {}),
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