import { CategoriaEventoRepository } from '../repositories/categoriaEvento.repository.js';
import { AppError } from '../utils/appError.js';

type TipoCategoriaEvento = 'ACADEMICO' | 'MANTENIMIENTO' | 'INSTITUCIONAL' | 'OTRO';

export interface CrearCategoriaDto {
  nombre: string;
  descripcion?: string;
  tipo: TipoCategoriaEvento;
  requiereAprobacion?: boolean;
  permiteInscripcionForm?: boolean;
  carreraId?: number;
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
   * Consulta las categorías asociadas a la carrera
   */
  static async listar(carreraId?: number, tipo?: TipoCategoriaEvento) {
    return await CategoriaEventoRepository.listarPorCarrera(carreraId || 0, tipo);
  }

  /**
   * Obtiene la categoría por ID
   */
  static async obtenerPorId(id: number, carreraId?: number) {
    const categoria = await CategoriaEventoRepository.buscarPorIdYCarrera(id, carreraId || 0);

    if (!categoria) {
      throw new AppError('La categoría no existe o no pertenece a su ámbito académico.', 404);
    }

    return categoria;
  }

  /**
   * Crea una nueva categoría
   */
  static async crear(datos: CrearCategoriaDto) {
    if (!datos.carreraId) {
      throw new AppError('No se pudo identificar la carrera o ámbito académico activo para asociar la categoría.', 400);
    }

    const existe = await CategoriaEventoRepository.buscarPorNombreYCarrera(datos.nombre, datos.carreraId);
    if (existe) {
      throw new AppError(`Ya existe una categoría registrada con el nombre "${datos.nombre}" en esta carrera.`, 400);
    }

    return await CategoriaEventoRepository.crear({
      nombre: datos.nombre,
      descripcion: datos.descripcion,
      tipo: datos.tipo,
      carrera: { connect: { id: datos.carreraId } },
    });
  }

  /**
   * Actualiza un registro de categoría
   */
  static async actualizar(id: number, carreraId: number | undefined, datos: ActualizarCategoriaDto) {
    if (carreraId) {
      await this.obtenerPorId(id, carreraId);
      if (datos.nombre) {
        const duplicado = await CategoriaEventoRepository.buscarPorNombreYCarrera(datos.nombre, carreraId, id);
        if (duplicado) {
          throw new AppError(`Ya existe otra categoría registrada con el nombre "${datos.nombre}".`, 400);
        }
      }
    }

    return await CategoriaEventoRepository.actualizar(id, datos);
  }

  /**
   * Elimina la categoría
   */
  static async eliminar(id: number, carreraId?: number) {
    if (carreraId) {
      await this.obtenerPorId(id, carreraId);
    }
    return await CategoriaEventoRepository.eliminar(id);
  }
}
