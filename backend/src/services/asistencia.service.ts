import { EstadoAsistencia, OrigenMarcado } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { asistenciaRepository } from '../repositories/asistencia.repository.js';
import { bitacoraRepository } from '../repositories/bitacora.repository.js';
import { AppError } from '../utils/appError.js';

export interface DTORegistrarAsistencia {
  tokenQR: string;
  estudianteId: number;
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
  async registrarAsistencia(data: DTORegistrarAsistencia) {
    const { tokenQR, estudianteId } = data;

    if (!tokenQR || !estudianteId) {
      throw new AppError('Se requieren los datos tokenQR y estudianteId.', 400);
    }

    // 1. Busca la sesión en SesionBitacora usando el tokenQR
    const sesion = await bitacoraRepository.obtenerPorToken(tokenQR);

    // 2. Valida que la sesión exista y continúe abierta (cumplio: false)
    if (!sesion || sesion.cumplio) {
      throw new AppError('El código QR es inválido o la sesión de laboratorio ha finalizado.', 400);
    }

    if (sesion.listaConfirmada) {
      throw new AppError('La lista de asistencia ya fue confirmada y no admite nuevos marcados.', 403);
    }

    if (sesion.materiaId === null || sesion.materiaId === undefined) {
      throw new AppError('La sesión no tiene una materia académica asociada.', 422);
    }

    // 3. Verifica identidad y matrícula académica activa para el grupo de la sesión
    const estudiante = await prisma.usuario.findUnique({
      where: { id: Number(estudianteId) },
      select: { id: true, nombre: true, apellido: true, correo: true, rol: { select: { nombre: true } } },
    });

    if (!estudiante) {
      throw new AppError('El estudiante especificado no se encuentra registrado en el sistema.', 404);
    }

    if (estudiante.rol?.nombre !== 'Estudiante') {
      throw new AppError('Solo un usuario con rol Estudiante puede registrar asistencia.', 403);
    }

    const inscripcion = await prisma.inscripcionMateria.findFirst({
      where: {
        estudianteId: estudiante.id,
        materiaId: sesion.materiaId,
        estado: 'ACTIVA',
        gestion: new Date().getFullYear(),
      },
    });
    if (!inscripcion) {
      throw new AppError(
        'Usted no se encuentra programado en esta materia o grupo en el semestre vigente.',
        403
      );
    }

    // 4. Comprueba que el estudiante no haya registrado previamente su asistencia
    const asistenciaExistente = await asistenciaRepository.buscarAsistenciaExistente(
      sesion.id,
      Number(estudianteId)
    );

    if (asistenciaExistente) {
      throw new AppError('Ya has registrado tu asistencia para esta clase de laboratorio.', 400);
    }

    // 5. Crea el registro en AsistenciaEstudiante
    const ahora = new Date();
    const nuevaAsistencia = await asistenciaRepository.registrar({
      sesionBitacoraId: sesion.id,
      estudianteId: Number(estudianteId),
      fechaHora: ahora,
    });

    // Formatear horaRegistro HH:mm:ss
    const hours = String(ahora.getHours()).padStart(2, '0');
    const minutes = String(ahora.getMinutes()).padStart(2, '0');
    const seconds = String(ahora.getSeconds()).padStart(2, '0');
    const horaRegistro = `${hours}:${minutes}:${seconds}`;

    const nombreCompleto = `${nuevaAsistencia.estudiante.nombre} ${nuevaAsistencia.estudiante.apellido || ''}`.trim();

    return {
      mensaje: 'Asistencia registrada exitosamente',
      estudiante: nombreCompleto,
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
    const sesion = await prisma.sesionBitacora.findUnique({ where: { id: sesionId } });
    if (!sesion) {
      throw new AppError('La sesión de bitácora no existe.', 404);
    }
    if (sesion.materiaId === null) {
      throw new AppError('La sesión no tiene una materia académica asociada.', 422);
    }

    const [inscripciones, asistencias] = await Promise.all([
      prisma.inscripcionMateria.findMany({
        where: {
          materiaId: sesion.materiaId,
          grupo: sesion.grupo,
          semestre: sesion.semestre,
          gestion: sesion.gestion,
          estado: 'ACTIVA',
        },
        include: { estudiante: { select: { id: true, nombre: true, apellido: true, correo: true } } },
        orderBy: { estudiante: { apellido: 'asc' } },
      }),
      prisma.asistenciaEstudiante.findMany({
        where: { sesionBitacoraId: sesionId },
        include: { equipo: { select: { id: true, nombre: true, codigoPatrimonial: true } } },
      }),
    ]);

    const asistenciasPorEstudiante = new Map(asistencias.map((asistencia) => [asistencia.estudianteId, asistencia]));
    const estudiantes = inscripciones.map((inscripcion) => {
      const asistencia = asistenciasPorEstudiante.get(inscripcion.estudianteId);
      return {
        estudiante: inscripcion.estudiante,
        estado: asistencia?.estado ?? EstadoAsistencia.FALTA,
        origen: asistencia?.origen ?? OrigenMarcado.SISTEMA_FALTA_AUTOMATICA,
        justificativo: asistencia?.justificativo ?? null,
        equipo: asistencia?.equipo ?? null,
        fechaHora: asistencia?.fechaHora ?? null,
        asistenciaId: asistencia?.id ?? null,
      };
    });

    const resumen = estudiantes.reduce(
      (conteo, estudiante) => {
        conteo[estudiante.estado] += 1;
        return conteo;
      },
      { PRESENTE: 0, ATRASO: 0, LICENCIA: 0, FALTA: 0 } as Record<EstadoAsistencia, number>
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
    if (sesion.materiaId === null) throw new AppError('La sesión no tiene una materia académica asociada.', 422);

    const inscripcion = await prisma.inscripcionMateria.findFirst({
      where: {
        estudianteId: data.estudianteId,
        materiaId: sesion.materiaId,
        grupo: sesion.grupo,
        semestre: sesion.semestre,
        gestion: sesion.gestion,
        estado: 'ACTIVA',
      },
    });
    if (!inscripcion) throw new AppError('El estudiante no pertenece al grupo de esta sesión.', 403);

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
    if (sesion.materiaId === null) throw new AppError('La sesión no tiene una materia académica asociada.', 422);

    const inscripciones = await prisma.inscripcionMateria.findMany({
      where: { materiaId: sesion.materiaId, grupo: sesion.grupo, semestre: sesion.semestre, gestion: sesion.gestion, estado: 'ACTIVA' },
      select: { estudianteId: true },
    });

    await prisma.$transaction(async (tx) => {
      for (const inscripcion of inscripciones) {
        await tx.asistenciaEstudiante.upsert({
          where: { sesionBitacoraId_estudianteId: { sesionBitacoraId: sesionId, estudianteId: inscripcion.estudianteId } },
          create: {
            sesionBitacoraId: sesionId,
            estudianteId: inscripcion.estudianteId,
            estado: EstadoAsistencia.FALTA,
            origen: OrigenMarcado.SISTEMA_FALTA_AUTOMATICA,
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
