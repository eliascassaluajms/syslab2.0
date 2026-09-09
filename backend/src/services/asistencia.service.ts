import { EstadoAsistencia, OrigenMarcado } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { asistenciaRepository } from '../repositories/asistencia.repository.js';
import { bitacoraRepository } from '../repositories/bitacora.repository.js';
import { AppError } from '../utils/appError.js';

export interface DTORegistrarAsistencia {
  tokenQR: string;
  estudianteId: number | string;
  codigoEquipoPatrimonial?: string;
}

export interface DTOActualizarAsistencia {
  sesionId: number;
  estudianteId: number;
  docenteId: number;
  estado: EstadoAsistencia;
  justificativo?: string;
  equipoId?: number;
}

export class AsistenciaService {
  async registrarAsistencia(data: { tokenQR: string; estudianteId: number | string; codigoEquipoPatrimonial?: string }) {
    const { tokenQR, estudianteId } = data;

    if (!tokenQR || !estudianteId) {
      throw new AppError('Se requieren los datos del código QR y el estudiante.', 400);
    }

    const sesion = await bitacoraRepository.obtenerPorToken(tokenQR);
    if (!sesion || sesion.cumplio) {
      throw new AppError('El código QR es inválido o la sesión de laboratorio ha finalizado.', 400);
    }

    if (sesion.listaConfirmada) {
      throw new AppError('La lista de asistencia ya fue confirmada y no admite nuevos marcados.', 403);
    }

    // Buscar estudiante por ID o por su Registro Universitario (username / RU)
    const idNumerico = Number(estudianteId);
    const estudiante = await prisma.usuario.findFirst({
      where: {
        OR: [
          ...(!Number.isNaN(idNumerico) ? [{ id: idNumerico }] : []),
          { username: String(estudianteId) },
        ],
      },
      select: { id: true, nombre: true, apellido: true, username: true, rol: { select: { nombre: true } } },
    });

    if (!estudiante) {
      throw new AppError('El estudiante especificado no se encuentra registrado en el sistema.', 404);
    }

    // Control estricto de duplicados para esta sesión
    const asistenciaExistente = await asistenciaRepository.buscarAsistenciaExistente(
      sesion.id,
      estudiante.id
    );

    if (asistenciaExistente) {
      throw new AppError('Ya has registrado tu asistencia para esta clase de laboratorio.', 400);
    }

    const ahora = new Date();
    const nuevaAsistencia = await asistenciaRepository.registrar({
      sesionBitacoraId: sesion.id,
      estudianteId: estudiante.id,
      fechaHora: ahora,
    });

    const horaRegistro = ahora.toTimeString().split(' ')[0];
    const nombreCompleto = `${nuevaAsistencia.estudiante.nombre} ${nuevaAsistencia.estudiante.apellido || ''}`.trim();

    return {
      mensaje: 'Asistencia registrada exitosamente',
      estudiante: nombreCompleto,
      ru: estudiante.username,
      horaRegistro,
    };
  }

  async listarPorSesion(sesionId: number) {
    if (!sesionId) {
      throw new AppError('El id de la sesión de bitácora es obligatorio.', 400);
    }
    return asistenciaRepository.listarPorSesion(Number(sesionId));
  }

  async obtenerListaConsolidada(sesionId: number) {
    const sesion = await prisma.sesionBitacora.findUnique({
      where: { id: sesionId },
      include: {
        laboratorio: { select: { id: true, nombre: true, codigo: true } },
        materia: { select: { id: true, nombre: true, codigo: true } },
        docente: { select: { id: true, nombre: true, apellido: true } },
      },
    });

    if (!sesion) {
      throw new AppError('La sesión de bitácora no existe.', 404);
    }

    // 1. Obtener estudiantes matriculados en la materia (búsqueda con cascada progresiva)
    let inscripciones: Array<{
      id?: number;
      estudianteId: number;
      materiaId?: number;
      grupo?: number;
      semestre?: number;
      gestion?: number;
      estudiante: {
        id: number;
        nombre: string;
        apellido: string | null;
        correo: string;
        username?: string;
      };
    }> = [];

    if (sesion.materiaId) {
      // Prioridad 1: Inscritos en la materia y grupo de la sesión con estado ACTIVA
      if (sesion.grupo) {
        inscripciones = await prisma.inscripcionMateria.findMany({
          where: {
            materiaId: sesion.materiaId,
            grupo: sesion.grupo,
            estado: 'ACTIVA',
          },
          include: {
            estudiante: {
              select: { id: true, nombre: true, apellido: true, correo: true, username: true },
            },
          },
          orderBy: { estudiante: { apellido: 'asc' } },
        });
      }

      // Prioridad 2: Si el grupo no arrojó resultados, buscar todos los matriculados activos en la materia
      if (inscripciones.length === 0) {
        inscripciones = await prisma.inscripcionMateria.findMany({
          where: {
            materiaId: sesion.materiaId,
            estado: 'ACTIVA',
          },
          include: {
            estudiante: {
              select: { id: true, nombre: true, apellido: true, correo: true, username: true },
            },
          },
          orderBy: { estudiante: { apellido: 'asc' } },
        });
      }

      // Prioridad 3: Todos los inscritos en la materia independientemente del estado
      if (inscripciones.length === 0) {
        inscripciones = await prisma.inscripcionMateria.findMany({
          where: {
            materiaId: sesion.materiaId,
          },
          include: {
            estudiante: {
              select: { id: true, nombre: true, apellido: true, correo: true, username: true },
            },
          },
          orderBy: { estudiante: { apellido: 'asc' } },
        });
      }
    }

    // 2. Obtener los registros de asistencia registrados para la sesión
    const asistencias = await prisma.asistenciaEstudiante.findMany({
      where: { sesionBitacoraId: sesionId },
      include: {
        estudiante: {
          select: { id: true, nombre: true, apellido: true, correo: true, username: true },
        },
        equipo: {
          select: { id: true, nombre: true, codigoPatrimonial: true },
        },
      },
      orderBy: { fechaHora: 'asc' },
    });

    const asistenciasPorEstudiante = new Map(asistencias.map((asistencia) => [asistencia.estudianteId, asistencia]));
    const estudiantesMap = new Map<number, any>();

    // 3. Cruzar los inscritos con sus asistencias registradas
    for (const inscripcion of inscripciones) {
      const est = inscripcion.estudiante;
      if (!est) continue;

      const asistencia = asistenciasPorEstudiante.get(est.id);
      estudiantesMap.set(est.id, {
        estudiante: est,
        nombreCompleto: `${est.nombre} ${est.apellido || ''}`.trim(),
        estado: asistencia?.estado ?? EstadoAsistencia.FALTA,
        origen: asistencia?.origen ?? OrigenMarcado.SISTEMA_FALTA_AUTOMATICA,
        justificativo: asistencia?.justificativo ?? null,
        equipo: asistencia?.equipo ?? null,
        fechaHora: asistencia?.fechaHora ?? null,
        asistenciaId: asistencia?.id ?? null,
      });
    }

    // 4. Cruzar también estudiantes que hayan marcado asistencia pero no figuren en la nómina de inscritos
    for (const asistencia of asistencias) {
      if (!estudiantesMap.has(asistencia.estudianteId)) {
        const est = asistencia.estudiante || {
          id: asistencia.estudianteId,
          nombre: 'Estudiante',
          apellido: `#${asistencia.estudianteId}`,
          correo: '',
          username: '',
        };
        estudiantesMap.set(asistencia.estudianteId, {
          estudiante: est,
          nombreCompleto: `${est.nombre} ${est.apellido || ''}`.trim(),
          estado: asistencia.estado,
          origen: asistencia.origen,
          justificativo: asistencia.justificativo ?? null,
          equipo: asistencia.equipo ?? null,
          fechaHora: asistencia.fechaHora ?? null,
          asistenciaId: asistencia.id,
        });
      }
    }

    const estudiantes = Array.from(estudiantesMap.values()).sort((a, b) => {
      const apA = (a.estudiante?.apellido || a.estudiante?.nombre || '').toLowerCase();
      const apB = (b.estudiante?.apellido || b.estudiante?.nombre || '').toLowerCase();
      return apA.localeCompare(apB);
    });

    const resumen = estudiantes.reduce(
      (conteo, est) => {
        if (est.estado === EstadoAsistencia.PRESENTE) conteo.PRESENTE++;
        else if (est.estado === EstadoAsistencia.ATRASO) conteo.ATRASO++;
        else if (est.estado === EstadoAsistencia.LICENCIA) conteo.LICENCIA++;
        else if (est.estado === EstadoAsistencia.FALTA) conteo.FALTA++;
        return conteo;
      },
      { PRESENTE: 0, ATRASO: 0, LICENCIA: 0, FALTA: 0 }
    );

    return {
      sesion,
      listaConfirmada: sesion.listaConfirmada,
      totalInscritos: estudiantes.length,
      presentes: resumen.PRESENTE,
      atrasos: resumen.ATRASO,
      licencias: resumen.LICENCIA,
      faltas: resumen.FALTA,
      estudiantes,
    };
  }

  async actualizarAsistencia(data: DTOActualizarAsistencia) {
    const estados = Object.values(EstadoAsistencia) as string[];
    if (!estados.includes(data.estado)) {
      throw new AppError('El estado de asistencia no es válido.', 400);
    }

    const sesion = await prisma.sesionBitacora.findUnique({ where: { id: data.sesionId } });
    if (!sesion) throw new AppError('La sesión de bitácora no existe.', 404);
    if (sesion.docenteId !== data.docenteId) throw new AppError('Solo el docente de la sesión puede ajustar la asistencia.', 403);
    if (sesion.listaConfirmada) throw new AppError('La lista de asistencia ya fue confirmada y es inmutable.', 403);

    // Verificar si el estudiante está matriculado en la materia o ya tiene asistencia en la sesión
    let inscripcionValida = false;
    if (sesion.materiaId) {
      const inscripcion = await prisma.inscripcionMateria.findFirst({
        where: {
          estudianteId: data.estudianteId,
          materiaId: sesion.materiaId,
        },
      });
      inscripcionValida = !!inscripcion;
    }

    const asistenciaExistente = await prisma.asistenciaEstudiante.findFirst({
      where: {
        sesionBitacoraId: data.sesionId,
        estudianteId: data.estudianteId,
      },
    });

    if (!inscripcionValida && !asistenciaExistente) {
      throw new AppError('El estudiante no pertenece a la materia de esta sesión.', 403);
    }

    if (data.equipoId !== undefined) {
      const equipo = await prisma.equipo.findFirst({ where: { id: data.equipoId, laboratorioId: sesion.laboratorioId } });
      if (!equipo) throw new AppError('El equipo no pertenece al laboratorio de la sesión.', 400);
    }

    const fechaHora = data.estado === EstadoAsistencia.PRESENTE || data.estado === EstadoAsistencia.ATRASO
      ? new Date()
      : null;
    return prisma.asistenciaEstudiante.upsert({
      where: { sesionBitacoraId_estudianteId: { sesionBitacoraId: data.sesionId, estudianteId: data.estudianteId } },
      create: {
        sesionBitacoraId: data.sesionId,
        estudianteId: data.estudianteId,
        estado: data.estado,
        origen: OrigenMarcado.MANUAL_DOCENTE,
        justificativo: data.justificativo?.trim() || null,
        equipoId: data.equipoId ?? null,
        fechaHora,
        modificadoPorId: data.docenteId,
      },
      update: {
        estado: data.estado,
        origen: OrigenMarcado.MANUAL_DOCENTE,
        justificativo: data.justificativo?.trim() || null,
        equipoId: data.equipoId ?? null,
        fechaHora,
        modificadoPorId: data.docenteId,
      },
      include: { estudiante: { select: { id: true, nombre: true, apellido: true, correo: true } } },
    });
  }

  async confirmarAsistencia(sesionId: number, docenteId: number) {
    const sesion = await prisma.sesionBitacora.findUnique({ where: { id: sesionId } });
    if (!sesion) throw new AppError('La sesión de bitácora no existe.', 404);
    if (sesion.docenteId !== docenteId) throw new AppError('Solo el docente de la sesión puede confirmar la asistencia.', 403);
    if (sesion.listaConfirmada) throw new AppError('La lista de asistencia ya fue confirmada.', 400);

    const listaConsolidada = await this.obtenerListaConsolidada(sesionId);

    await prisma.$transaction(async (tx) => {
      for (const item of listaConsolidada.estudiantes) {
        await tx.asistenciaEstudiante.upsert({
          where: { sesionBitacoraId_estudianteId: { sesionBitacoraId: sesionId, estudianteId: item.estudiante.id } },
          create: {
            sesionBitacoraId: sesionId,
            estudianteId: item.estudiante.id,
            estado: item.estado,
            origen: item.origen || OrigenMarcado.SISTEMA_FALTA_AUTOMATICA,
            justificativo: item.justificativo,
            equipoId: item.equipo?.id ?? null,
            fechaHora: item.fechaHora ? new Date(item.fechaHora) : null,
          },
          update: {},
        });
      }
      await tx.sesionBitacora.update({ where: { id: sesionId }, data: { listaConfirmada: true, fechaConfirmacionLista: new Date() } });
    });

    return this.obtenerListaConsolidada(sesionId);
  }
}

export const asistenciaService = new AsistenciaService();
