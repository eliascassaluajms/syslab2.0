import { EstadoActivo, EstadoIncidencia, PrioridadIncidencia, Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { incidenciasRepository } from '../repositories/incidencias.repository.js';
import { AppError } from '../utils/appError.js';
import {
  CrearIncidenciaDTO,
  GestionarIncidenciaDTO,
  ActualizarEstadoIncidenciaDTO,
  FiltrosIncidenciaDTO,
} from '../interfaces/incidencia.interface.js';

export class IncidenciasService {
  /**
   * Obtiene las incidencias filtradas por el ámbito del usuario y los parámetros solicitados.
   */
  async obtenerIncidencias(usuario: any, filtros: FiltrosIncidenciaDTO) {
    const whereCondition: Prisma.IncidenciaWhereInput = {};

    // Filtrado perimetral estricto si el usuario no es Administrador Global
    if (usuario && !usuario.esGlobal) {
      const carrerasUsuario: number[] = usuario.carreras || [];
      whereCondition.laboratorio = {
        OR: [
          { carreraId: { in: carrerasUsuario } },
          { facultad: { carreras: { some: { id: { in: carrerasUsuario } } } } },
        ],
      };
    }

    // Filtros opcionales
    if (filtros.laboratorioId) {
      whereCondition.laboratorioId = Number(filtros.laboratorioId);
    }
    if (filtros.equipoId) {
      whereCondition.equipoId = Number(filtros.equipoId);
    }
    if (filtros.estado) {
      whereCondition.estado = filtros.estado;
    }
    if (filtros.prioridad) {
      whereCondition.prioridad = filtros.prioridad;
    }
    if (filtros.solicitanteId) {
      whereCondition.solicitanteId = Number(filtros.solicitanteId);
    }
    if (filtros.tecnicoId) {
      whereCondition.tecnicoId = Number(filtros.tecnicoId);
    }

    return await incidenciasRepository.findAll(whereCondition);
  }

  /**
   * Obtiene el detalle de una incidencia por su ID validando el ámbito institucional.
   */
  async obtenerIncidenciaPorId(id: number, usuario: any) {
    const incidencia = await incidenciasRepository.findById(id);

    if (!incidencia) {
      throw new AppError('La incidencia solicitada no existe.', 404);
    }

    // Verificar ámbito si el usuario no es global
    if (usuario && !usuario.esGlobal) {
      const carrerasUsuario: number[] = usuario.carreras || [];
      const lab = incidencia.laboratorio;

      const tieneAcceso =
        (lab.carreraId && carrerasUsuario.includes(lab.carreraId)) ||
        (await prisma.carrera.findFirst({
          where: { facultadId: lab.facultadId, id: { in: carrerasUsuario } },
        }));

      if (!tieneAcceso) {
        throw new AppError('No tiene permisos para acceder a esta incidencia.', 403);
      }
    }

    return incidencia;
  }

  /**
   * Reporta una nueva incidencia y cambia el estado del equipo si aplica.
   */
  async reportarIncidencia(solicitanteId: number, dto: CrearIncidenciaDTO, usuario: any) {
    if (!dto.titulo || !dto.titulo.trim()) {
      throw new AppError('El título de la incidencia es obligatorio.', 400);
    }

    if (!dto.descripcion || !dto.descripcion.trim()) {
      throw new AppError('La descripción de la incidencia es obligatoria.', 400);
    }

    const laboratorioId = Number(dto.laboratorioId);
    if (isNaN(laboratorioId)) {
      throw new AppError('El ID del laboratorio debe ser un número válido.', 400);
    }

    // Verificar existencia del laboratorio
    const laboratorio = await prisma.laboratorio.findUnique({
      where: { id: laboratorioId },
    });

    if (!laboratorio) {
      throw new AppError('El laboratorio especificado no existe.', 404);
    }

    // Verificar permisos por ámbito
    if (usuario && !usuario.esGlobal) {
      const carrerasUsuario: number[] = usuario.carreras || [];
      const tieneAcceso =
        (laboratorio.carreraId && carrerasUsuario.includes(laboratorio.carreraId)) ||
        (await prisma.carrera.findFirst({
          where: { facultadId: laboratorio.facultadId, id: { in: carrerasUsuario } },
        }));

      if (!tieneAcceso) {
        throw new AppError('No tiene permisos para reportar incidencias en este laboratorio.', 403);
      }
    }

    // Validar equipo opcional
    let equipoId: number | undefined = undefined;
    if (dto.equipoId) {
      equipoId = Number(dto.equipoId);
      if (isNaN(equipoId)) {
        throw new AppError('El ID del equipo debe ser numérico.', 400);
      }

      const equipo = await prisma.equipo.findUnique({
        where: { id: equipoId },
      });

      if (!equipo) {
        throw new AppError('El equipo especificado no existe.', 404);
      }

      if (equipo.laboratorioId !== laboratorioId) {
        throw new AppError('El equipo especificado no pertenece al laboratorio indicado.', 400);
      }

      // Actualizar estado del equipo a EN_MANTENIMIENTO
      await prisma.equipo.update({
        where: { id: equipoId },
        data: { estado: EstadoActivo.EN_MANTENIMIENTO },
      });
    }

    // Crear la incidencia
    const nuevaIncidencia = await incidenciasRepository.create({
      laboratorioId,
      solicitanteId,
      equipoId,
      titulo: dto.titulo.trim(),
      descripcion: dto.descripcion.trim(),
      prioridad: dto.prioridad || PrioridadIncidencia.MEDIA,
      estado: EstadoIncidencia.PENDIENTE,
    });

    return nuevaIncidencia;
  }

  /**
   * Actualiza el estado, técnico asignado y/o solución de una incidencia.
   */
  async actualizarEstadoIncidencia(id: number, dto: GestionarIncidenciaDTO, usuario: any) {
    const incidenciaExistente = await incidenciasRepository.findById(id);

    if (!incidenciaExistente) {
      throw new AppError('La incidencia no existe.', 404);
    }

    // Validar ámbito del usuario
    if (usuario && !usuario.esGlobal) {
      const carrerasUsuario: number[] = usuario.carreras || [];
      const lab = incidenciaExistente.laboratorio;

      const tieneAcceso =
        (lab.carreraId && carrerasUsuario.includes(lab.carreraId)) ||
        (await prisma.carrera.findFirst({
          where: { facultadId: lab.facultadId, id: { in: carrerasUsuario } },
        }));

      if (!tieneAcceso) {
        throw new AppError('No tiene permisos para modificar esta incidencia.', 403);
      }
    }

    // Validar técnico si se proporciona
    let tecnicoId: number | undefined = undefined;
    if (dto.tecnicoId) {
      tecnicoId = Number(dto.tecnicoId);
      const tecnico = await prisma.usuario.findUnique({ where: { id: tecnicoId } });
      if (!tecnico) {
        throw new AppError('El técnico asignado especificado no existe.', 404);
      }
    }

    const dataUpdate: Prisma.IncidenciaUncheckedUpdateInput = {};

    if (dto.estado) {
      dataUpdate.estado = dto.estado;
    }

    if (dto.prioridad) {
      dataUpdate.prioridad = dto.prioridad;
    }

    if (tecnicoId !== undefined) {
      dataUpdate.tecnicoId = tecnicoId;
    }

    if (dto.solucion !== undefined) {
      dataUpdate.solucion = dto.solucion;
    }

    if (dto.estado === EstadoIncidencia.RESUELTO) {
      dataUpdate.fechaResolucion = new Date();
    }

    // Transición de estados del equipo si existe equipoId asociado
    if (incidenciaExistente.equipoId) {
      if (dto.estado === EstadoIncidencia.RESUELTO || dto.estado === EstadoIncidencia.RECHAZADO) {
        await prisma.equipo.update({
          where: { id: incidenciaExistente.equipoId },
          data: { estado: EstadoActivo.OPERATIVO },
        });
      } else if (dto.estado === EstadoIncidencia.EN_PROCESO) {
        await prisma.equipo.update({
          where: { id: incidenciaExistente.equipoId },
          data: { estado: EstadoActivo.EN_MANTENIMIENTO },
        });
      }
    }

    return await incidenciasRepository.update(id, dataUpdate);
  }

  /**
   * Elimina una incidencia del sistema.
   */
  async eliminarIncidencia(id: number, usuario: any) {
    const incidencia = await incidenciasRepository.findById(id);

    if (!incidencia) {
      throw new AppError('La incidencia especificada no existe.', 404);
    }

    if (usuario && !usuario.esGlobal) {
      const carrerasUsuario: number[] = usuario.carreras || [];
      const lab = incidencia.laboratorio;

      const tieneAcceso =
        (lab.carreraId && carrerasUsuario.includes(lab.carreraId)) ||
        (await prisma.carrera.findFirst({
          where: { facultadId: lab.facultadId, id: { in: carrerasUsuario } },
        }));

      if (!tieneAcceso) {
        throw new AppError('No tiene permisos para eliminar esta incidencia.', 403);
      }
    }

    await incidenciasRepository.delete(id);
    return true;
  }
}

export const incidenciasService = new IncidenciasService();
