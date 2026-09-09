import crypto from 'crypto';
import { TipoUsoLaboratorio, EstadoInscripcionMateria, EstadoAsistencia, OrigenMarcado } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { bitacoraRepository } from '../repositories/bitacora.repository.js';
import { asistenciaRepository } from '../repositories/asistencia.repository.js';
import { pdfGeneratorService } from './pdfGenerator.service.js';
import { AppError } from '../utils/appError.js';
import { timeToMinutes } from './horario.service.js';

export interface IniciarBitacoraDTO {
  laboratorioId: number;
  materiaId?: number;
  docenteId?: number;
  nombreAyudante?: string;
  materiaNombre?: string;
  tipoUso?: TipoUsoLaboratorio;
  solicitudExtraordinariaId?: number;
  practicaRealizada?: string;
  esAdminOJefe?: boolean;
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
      tipoUso,
      practicaRealizada,
      esAdminOJefe,
    } = data;

    let { materiaNombre } = data;

    if (!laboratorioId) {
      throw new AppError('El id del laboratorio es obligatorio para iniciar la bitácora.', 400);
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = now.getDate();

    const fechaInicioDia = new Date(year, month, date, 0, 0, 0, 0);
    const fechaFinDia = new Date(year, month, date, 23, 59, 59, 999);

    const sesionActiva = await bitacoraRepository.obtenerSesionActiva(
      Number(laboratorioId),
      fechaInicioDia,
      fechaFinDia
    );

    if (sesionActiva) {
      throw new AppError('El laboratorio ya cuenta con una sesión de bitácora activa en este momento.', 400);
    }

    const diaSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][now.getDay()];

    // Buscar si existe un horario registrado para la materia y laboratorio seleccionados
    let horarioValido = null;
    if (materiaId) {
      horarioValido = await prisma.horario.findFirst({
        where: {
          laboratorioId: Number(laboratorioId),
          materiaId: Number(materiaId),
          ...(docenteId ? { docenteId: Number(docenteId) } : {}),
        },
        include: { materia: true, docente: true },
      });
    }

    // Si no se encuentra por materia específica, se busca cualquier horario activo del laboratorio o docente
    if (!horarioValido) {
      const horariosCercanos = await prisma.horario.findMany({
        where: {
          laboratorioId: Number(laboratorioId),
          ...(docenteId ? { docenteId: Number(docenteId) } : {}),
        },
        include: { materia: true, docente: true },
        orderBy: { id: 'desc' },
      });
      horarioValido = horariosCercanos[0] || null;
    }

    let tipoUsoAutorizado: TipoUsoLaboratorio = TipoUsoLaboratorio.REGULAR;
    let materiaAutorizada = materiaId ? Number(materiaId) : horarioValido?.materiaId;
    let grupoAutorizado = horarioValido?.grupo ?? 1;
    let semestreAutorizado = horarioValido?.semestre ?? 1;
    let gestionAutorizada = horarioValido?.gestion ?? year;
    let docenteFinalId: number | null | undefined = docenteId ? Number(docenteId) : horarioValido?.docenteId;

    if (horarioValido) {
      materiaNombre = materiaNombre?.trim() || horarioValido.materia?.nombre;
    } else if (tipoUso === TipoUsoLaboratorio.EXTRAORDINARIO && data.solicitudExtraordinariaId) {
      const solicitud = await prisma.solicitudHorarioExtraordinario.findUnique({
        where: { id: Number(data.solicitudExtraordinariaId) },
      });
      if (solicitud) {
        tipoUsoAutorizado = TipoUsoLaboratorio.EXTRAORDINARIO;
        materiaNombre = materiaNombre?.trim() || solicitud.materia;
        docenteFinalId = docenteId ? Number(docenteId) : solicitud.docenteId;
      }
    }

    // Si es administrador o jefe y no se especificó docente, permitimos asignar un valor por defecto o nulo controlado
    if (!docenteFinalId && esAdminOJefe) {
      docenteFinalId = null as any;
    } else if (!docenteFinalId) {
      throw new AppError('No se pudo determinar el docente responsable de la sesión.', 400);
    }

    const tokenQR = crypto.randomUUID();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const horaInicio = `${hours}:${minutes}`;

    return bitacoraRepository.crear({
      laboratorioId: Number(laboratorioId),
      materiaId: materiaAutorizada ? Number(materiaAutorizada) : null,
      grupo: grupoAutorizado,
      semestre: semestreAutorizado,
      gestion: gestionAutorizada,
      docenteId: docenteFinalId ? Number(docenteFinalId) : null,
      nombreAyudante: nombreAyudante ? nombreAyudante.trim() : null,
      materiaNombre: materiaNombre ? materiaNombre.trim() : 'Uso de Laboratorio',
      tipoUso: tipoUsoAutorizado,
      fecha: now,
      horaInicio,
      tokenQR,
      practicaRealizada: practicaRealizada?.trim() || null,
    });
  }

  async registrarAsistenciaEstudiante(params: {
    tokenQR: string;
    estudianteId: number;
    codigoEquipoPatrimonial?: string;
  }) {
    const { tokenQR, estudianteId, codigoEquipoPatrimonial } = params;

    const sesion = await bitacoraRepository.obtenerPorToken(tokenQR);
    if (!sesion) {
      throw new AppError('El código QR es inválido o no existe.', 404);
    }

    if (sesion.cumplio) {
      throw new AppError('La sesión de laboratorio ya fue finalizada.', 400);
    }

    if (sesion.listaConfirmada) {
      throw new AppError('La lista de asistencia para esta sesión ya ha sido consolidada por el docente.', 400);
    }

    if (!sesion.materiaId) {
      throw new AppError('La sesión activa no cuenta con una materia curricular asignada.', 400);
    }

    // Validación contra el padrón oficial de materias matriculadas
    const inscripcion = await prisma.inscripcionMateria.findFirst({
      where: {
        estudianteId,
        materiaId: sesion.materiaId,
        grupo: sesion.grupo,
        gestion: sesion.gestion,
        estado: EstadoInscripcionMateria.ACTIVA,
      },
    });

    if (!inscripcion) {
      throw new AppError(
        `Acceso no autorizado: No figuras como estudiante matriculado en ${sesion.materiaNombre || 'esta asignatura'} (Grupo ${sesion.grupo}, Gestión ${sesion.gestion}).`,
        403
      );
    }

    const yaMarco = await prisma.asistenciaEstudiante.findUnique({
      where: {
        sesionBitacoraId_estudianteId: {
          sesionBitacoraId: sesion.id,
          estudianteId,
        },
      },
    });

    if (yaMarco) {
      throw new AppError('Ya has registrado tu asistencia en esta sesión de laboratorio.', 400);
    }

    let equipoId: number | null = null;
    if (codigoEquipoPatrimonial) {
      const equipo = await prisma.equipo.findUnique({
        where: { codigoPatrimonial: codigoEquipoPatrimonial.trim() },
      });
      if (equipo && equipo.laboratorioId === sesion.laboratorioId) {
        equipoId = equipo.id;
      }
    }

    const now = new Date();
    const [horaH, horaM] = sesion.horaInicio.split(':').map(Number);
    const fechaSesion = new Date(sesion.fecha);
    fechaSesion.setHours(horaH, horaM, 0, 0);

    const diferenciaMinutos = (now.getTime() - fechaSesion.getTime()) / (1000 * 60);
    const estado: EstadoAsistencia = diferenciaMinutos > 15 ? EstadoAsistencia.ATRASO : EstadoAsistencia.PRESENTE;

    const asistencia = await prisma.asistenciaEstudiante.create({
      data: {
        sesionBitacoraId: sesion.id,
        estudianteId,
        equipoId,
        fechaHora: now,
        estado,
        origen: OrigenMarcado.QR_ESTUDIANTE,
      },
      include: {
        estudiante: {
          select: { id: true, username: true, nombre: true, apellido: true },
        },
        equipo: {
          select: { id: true, codigoPatrimonial: true, nombre: true },
        },
      },
    });

    return {
      asistenciaId: asistencia.id,
      estudiante: `${asistencia.estudiante.nombre} ${asistencia.estudiante.apellido}`,
      ru: asistencia.estudiante.username,
      estado: asistencia.estado,
      fechaHora: asistencia.fechaHora,
      equipo: asistencia.equipo?.codigoPatrimonial || null,
      materia: sesion.materiaNombre,
      grupo: sesion.grupo,
    };
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
      laboratorioId: sesion.laboratorioId,
      laboratorio: sesion.laboratorio?.nombre || 'Laboratorio',
      materiaId: sesion.materiaId,
      materia: materiaNombre,
      grupo: sesion.grupo,
      semestre: sesion.semestre,
      gestion: sesion.gestion,
      docente: docenteNombre,
      fecha: fechaFormat,
    };
  }

  async obtenerNominaSesion(sesionId: number) {
    const sesion = await bitacoraRepository.obtenerPorId(sesionId);
    if (!sesion) {
      throw new AppError('La sesión de bitácora no existe.', 404);
    }

    if (!sesion.materiaId) {
      return [];
    }

    const matriculados = await prisma.inscripcionMateria.findMany({
      where: {
        materiaId: sesion.materiaId,
        grupo: sesion.grupo,
        gestion: sesion.gestion,
        estado: EstadoInscripcionMateria.ACTIVA,
      },
      include: {
        estudiante: {
          select: {
            id: true,
            username: true,
            nombre: true,
            apellido: true,
            correo: true,
          },
        },
      },
      orderBy: {
        estudiante: { apellido: 'asc' },
      },
    });

    const asistenciasDb = await asistenciaRepository.listarPorSesion(sesionId);
    const asistenciasMap = new Map(asistenciasDb.map((a) => [a.estudianteId, a]));

    return matriculados.map((item) => {
      const asistencia = asistenciasMap.get(item.estudianteId);
      return {
        estudianteId: item.estudiante.id,
        ru: item.estudiante.username,
        nombre: item.estudiante.nombre,
        apellido: item.estudiante.apellido,
        nombreCompleto: `${item.estudiante.apellido} ${item.estudiante.nombre}`,
        correo: item.estudiante.correo,
        grupo: item.grupo,
        semestre: item.semestre,
        marcado: Boolean(asistencia),
        estadoAsistencia: asistencia ? asistencia.estado : 'FALTA',
        fechaHora: asistencia?.fechaHora || null,
        equipo: asistencia?.equipo?.codigoPatrimonial || null,
      };
    });
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
      estado: a.estado,
      justificativo: a.justificativo,
      equipo: a.equipo,
      estudiante: {
        id: a.estudiante.id,
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