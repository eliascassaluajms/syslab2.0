import { CategoriaEventoRepository } from '../repositories/categoriaEvento.repository.js';
import { AppError } from '../utils/appError.js';

type TipoCategoriaEvento = 'ACADEMICO' | 'MANTENIMIENTO' | 'INSTITUCIONAL' | 'OTRO';

export interface CrearCategoriaDto {
  nombre: string;
  descripcion?: string;
  tipo: TipoCategoriaEvento;
  requiereAprobacion?: boolean;
  permiteInscripcionForm?: boolean;
  carreraId?: number | null;
}

export interface ActualizarCategoriaDto {
  nombre?: string;
  descripcion?: string;
  tipo?: TipoCategoriaEvento;
  requiereAprobacion?: boolean;
  permiteInscripcionForm?: boolean;
  activo?: boolean;
}

export class CategoriaEventoService {
  /**
   * Lista todas las categorías globales disponibles
   */
  static async listar(carreraId?: number, tipo?: TipoCategoriaEvento) {
    // Reutilizamos el método del repositorio pasando 0 para ignorar el filtro estricto de carrera si la consulta lo soporta,
    // o puedes usar directamente Prisma en el repositorio. Usamos 0 como comodín global.
    return await CategoriaEventoRepository.listarPorCarrera(0, tipo);
  }

  /**
   * Obtiene la categoría por ID de forma global
   */
  static async obtenerPorId(id: number, carreraId?: number) {
    // Buscamos ignorando la restricción de carrera pasando 0
    const categoria = await CategoriaEventoRepository.buscarPorIdYCarrera(id, 0);

    if (!categoria) {
      throw new AppError('La categoría no existe.', 404);
    }

    return categoria;
  }

  /**
   * Crea una nueva categoría global
   */
  static async crear(datos: CrearCategoriaDto) {
    const existe = await CategoriaEventoRepository.buscarPorNombreYCarrera(datos.nombre, 0);
    if (existe) {
      throw new AppError(`Ya existe una categoría registrada con el nombre "${datos.nombre}".`, 400);
    }

    return await CategoriaEventoRepository.crear({
      nombre: datos.nombre,
      descripcion: datos.descripcion,
      tipo: datos.tipo,
      requiereAprobacion: datos.requiereAprobacion ?? false,
      permiteInscripcionForm: datos.permiteInscripcionForm ?? false,
      activo: true,
      // Sin carrera asignada para que sea global (carreraId: null)
    });
  }

  /**
   * Actualiza un registro de categoría global
   */
  static async actualizar(id: number, carreraId: number | undefined, datos: ActualizarCategoriaDto) {
    await this.obtenerPorId(id);
    
    if (datos.nombre) {
      const duplicado = await CategoriaEventoRepository.buscarPorNombreYCarrera(datos.nombre, 0, id);
      if (duplicado) {
        throw new AppError(`Ya existe otra categoría registrada con el nombre "${datos.nombre}".`, 400);
      }
    }

    return await CategoriaEventoRepository.actualizar(id, datos);
  }

  /**
   * Elimina la categoría de forma global
   */
  static async eliminar(id: number, carreraId?: number) {
    await this.obtenerPorId(id);
    return await CategoriaEventoRepository.eliminar(id);
  }
}