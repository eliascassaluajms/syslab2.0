import crypto from 'crypto';
import { TipoUsoLaboratorio } from '@prisma/client';
import { bitacoraRepository } from '../repositories/bitacora.repository.js';
import { asistenciaRepository } from '../repositories/asistencia.repository.js';
import { pdfGeneratorService } from './pdfGenerator.service.js';
import { AppError } from '../utils/appError.js';

export interface IniciarBitacoraDTO {
  laboratorioId: number;
  materiaId?: number;
  docenteId?: number;
  nombreAyudante?: string;
  materiaNombre?: string;
  tipoUso?: TipoUsoLaboratorio;
  solicitudExtraordinariaId?: number;
}

export interface FinalizarBitacoraDTO {
  practicaRealizada?: string;
  cumplio?: boolean;
}

export class BitacoraService {
  async iniciarSesion(data: IniciarBitacoraDTO) {
    const {
      laboratorioId,
      materiaId,
      docenteId,
      nombreAyudante,
      materiaNombre,
      tipoUso,
    } = data;

    if (!laboratorioId) {
      throw new AppError('El id del laboratorio es obligatorio para iniciar la bitácora.', 400);
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = now.getDate();

    const fechaInicioDia = new Date(Date.UTC(year, month, date, 0, 0, 0));
    const fechaFinDia = new Date(Date.UTC(year, month, date, 23, 59, 59));

    // 1. Verifica que el laboratorio no tenga ya una sesión activa
    const sesionActiva = await bitacoraRepository.obtenerSesionActiva(
      Number(laboratorioId),
      fechaInicioDia,
      fechaFinDia
    );

    if (sesionActiva) {
      throw new AppError('El laboratorio ya cuenta con una sesión de bitácora activa en este momento.', 400);
    }

    // 2. Genera un token QR único y seguro
    const tokenQR = crypto.randomUUID();

    // 3. Hora inicio actual HH:mm
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const horaInicio = `${hours}:${minutes}`;

    // 4. Registra la entrada en SesionBitacora
    return bitacoraRepository.crear({
      laboratorioId: Number(laboratorioId),
      materiaId: materiaId ? Number(materiaId) : null,
      docenteId: docenteId ? Number(docenteId) : null,
      nombreAyudante: nombreAyudante ? nombreAyudante.trim() : null,
      materiaNombre: materiaNombre ? materiaNombre.trim() : null,
      tipoUso: tipoUso ?? TipoUsoLaboratorio.REGULAR,
      fecha: now,
      horaInicio,
      tokenQR,
    });
  }

  async finalizarSesion(id: number, data: FinalizarBitacoraDTO) {
    const sesion = await bitacoraRepository.obtenerPorId(id);
    if (!sesion) {
      throw new AppError('La sesión de bitácora no existe.', 404);
    }

    if (sesion.cumplio) {
      throw new AppError('La sesión de bitácora ya fue finalizada anteriormente.', 400);
    }

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const horaFin = `${hours}:${minutes}`;

    return bitacoraRepository.finalizar(id, {
      horaFin,
      practicaRealizada: data.practicaRealizada ? data.practicaRealizada.trim() : null,
      cumplio: data.cumplio !== undefined ? Boolean(data.cumplio) : true,
    });
  }

  async validarTokenQR(token: string) {
    if (!token) {
      throw new AppError('Debe proporcionar un token QR válido.', 400);
    }

    const sesion = await bitacoraRepository.obtenerPorToken(token);
    if (!sesion || sesion.cumplio) {
      throw new AppError('El código QR ha expirado o la clase ha finalizado.', 404);
    }

    const docenteNombre = sesion.docente
      ? `${sesion.docente.nombre} ${sesion.docente.apellido || ''}`.trim()
      : sesion.nombreAyudante || 'Docente / Auxiliar';

    const materiaNombre = sesion.materiaNombre || sesion.materia?.nombre || 'Uso de laboratorio';

    const fechaFormat = sesion.fecha.toISOString().split('T')[0];

    return {
      sesionId: sesion.id,
      laboratorio: sesion.laboratorio?.nombre || 'Laboratorio',
      materia: materiaNombre,
      docente: docenteNombre,
      fecha: fechaFormat,
    };
  }

  async listarSesiones(filtros: { laboratorioId?: number; fecha?: string; cumplio?: boolean }) {
    return bitacoraRepository.listar(filtros);
  }

  async generarPDFSesion(id: number): Promise<Buffer> {
    const sesion = await bitacoraRepository.obtenerPorId(id);
    if (!sesion) {
      throw new AppError('La sesión de bitácora no existe.', 404);
    }

    const asistenciasDb = await asistenciaRepository.listarPorSesion(id);

    const asistencias = asistenciasDb.map((a) => ({
      fechaHora: a.fechaHora,
      estudiante: {
        nombre: a.estudiante.nombre,
        apellido: a.estudiante.apellido,
        correo: a.estudiante.correo,
      },
    }));

    return pdfGeneratorService.generarPlanillaAsistencia({
      sesion,
      asistencias,
    });
  }
}

export const bitacoraService = new BitacoraService();
