import { prisma } from '../config/prisma.js';
import { Prisma } from '@prisma/client';

type TipoCategoriaEvento = 'ACADEMICO' | 'MANTENIMIENTO' | 'INSTITUCIONAL' | 'OTRO';

export class CategoriaEventoRepository {
  static async listarPorCarrera(carreraId?: number, tipo?: TipoCategoriaEvento) {
    return await (prisma as any).categoriaEvento.findMany({
      where: {
        ...(carreraId && carreraId > 0 ? { carreraId } : {}),
        ...(tipo && { tipo }),
      },
      orderBy: { nombre: 'asc' },
    });
  }

  static async buscarPorIdYCarrera(id: number, carreraId?: number) {
    return await (prisma as any).categoriaEvento.findFirst({
      where: {
        id,
        ...(carreraId && carreraId > 0 ? { carreraId } : {}),
      },
    });
  }

  static async buscarPorNombreYCarrera(nombre: string, carreraId?: number, idExcluido?: number) {
    return await (prisma as any).categoriaEvento.findFirst({
      where: {
        ...(carreraId && carreraId > 0 ? { carreraId } : {}),
        nombre: { equals: nombre, mode: 'insensitive' },
        ...(idExcluido && { NOT: { id: idExcluido } }),
      },
    });
  }

  static async crear(datos: any) {
    return await (prisma as any).categoriaEvento.create({ data: datos });
  }

  static async actualizar(id: number, datos: any) {
    return await (prisma as any).categoriaEvento.update({
      where: { id },
      data: datos,
    });
  }

  static async eliminar(id: number) {
    return await (prisma as any).categoriaEvento.delete({
      where: { id },
    });
  }
}