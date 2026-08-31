import { EstadoSolicitud } from '@prisma/client';
import {
  solicitudExtraordinariaRepository,
  ListarSolicitudesFiltros,
} from '../repositories/solicitudExtraordinaria.repository.js';
import { horarioService, timeToMinutes } from './horario.service.js';
import { AppError } from '../utils/appError.js';

export interface DTOHorarioExtraordinario {
  laboratorioId: number;
  docenteId?: number;
  solicitadoPorDirector?: boolean;
  nombreAyudante?: string;
  materia: string;
  fecha: string; // YYYY-MM-DD
  horaInicio: string; // HH:mm
  horaFin: string; // HH:mm
  motivo: string;
}

export class SolicitudExtraordinariaService {
  async crear(data: DTOHorarioExtraordinario) {
    const {
      laboratorioId,
      docenteId,
      solicitadoPorDirector,
      nombreAyudante,
      materia,
      fecha,
      horaInicio,
      horaFin,
      motivo,
    } = data;

    if (!laboratorioId || !materia || !fecha || !horaInicio || !horaFin || !motivo) {
      throw new AppError('Faltan campos obligatorios para registrar la solicitud extraordinaria.', 400);
    }

    if (solicitadoPorDirector && !nombreAyudante?.trim()) {
      throw new AppError('Debe especificar el nombre del ayudante si es solicitado por el director.', 400);
    }

    const minInicio = timeToMinutes(horaInicio);
    const minFin = timeToMinutes(horaFin);
    if (minFin <= minInicio) {
      throw new AppError('La hora de inicio debe ser menor a la hora de fin.', 400);
    }

    // Parse date YYYY-MM-DD
    const parts = fecha.split('-');
    if (parts.length !== 3) {
      throw new AppError('Formato de fecha inválido. Debe ser YYYY-MM-DD.', 400);
    }
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);

    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      throw new AppError('Fecha inválida.', 400);
    }

    const fechaObj = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

    // Validación de Dominio: Verificar disponibilidad del laboratorio
    const estaDisponible = await horarioService.esLaboratorioDisponible({
      laboratorioId: Number(laboratorioId),
      fecha,
      horaInicio,
      horaFin,
    });

    if (!estaDisponible) {
      throw new AppError('El laboratorio no está disponible en la fecha y rango de horas solicitados.', 400);
    }

    return solicitudExtraordinariaRepository.crear({
      laboratorioId: Number(laboratorioId),
      docenteId: docenteId ? Number(docenteId) : null,
      solicitadoPorDirector: Boolean(solicitadoPorDirector),
      nombreAyudante: nombreAyudante ? nombreAyudante.trim() : null,
      materia: materia.trim(),
      fecha: fechaObj,
      horaInicio,
      horaFin,
      motivo: motivo.trim(),
      estado: EstadoSolicitud.PENDIENTE,
    });
  }

  async listar(filtros: ListarSolicitudesFiltros) {
    return solicitudExtraordinariaRepository.listar(filtros);
  }

  async actualizarEstado(id: number, estado: EstadoSolicitud) {
    if (![EstadoSolicitud.APROBADO, EstadoSolicitud.RECHAZADO, EstadoSolicitud.PENDIENTE].includes(estado)) {
      throw new AppError('El estado proporcionado no es válido.', 400);
    }

    const solicitud = await solicitudExtraordinariaRepository.obtenerPorId(id);
    if (!solicitud) {
      throw new AppError('La solicitud de horario extraordinario no existe.', 404);
    }

    if (estado === EstadoSolicitud.APROBADO) {
      // Re-evalúa la disponibilidad del laboratorio para prevenir solapamientos concurrentes
      const fechaStr = solicitud.fecha.toISOString().split('T')[0];
      const estaDisponible = await horarioService.esLaboratorioDisponible({
        laboratorioId: solicitud.laboratorioId,
        fecha: fechaStr,
        horaInicio: solicitud.horaInicio,
        horaFin: solicitud.horaFin,
        excludeSolicitudId: id,
      });

      if (!estaDisponible) {
        throw new AppError(
          'No se puede aprobar la solicitud porque el laboratorio ya se encuentra ocupado o reservado en ese horario.',
          400
        );
      }
    }

    return solicitudExtraordinariaRepository.actualizarEstado(id, estado);
  }
}

export const solicitudExtraordinariaService = new SolicitudExtraordinariaService();
