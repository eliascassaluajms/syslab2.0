import crypto from 'crypto';
import { EstadoAsistencia, EstadoInscripcionMateria, OrigenMarcado } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { unlockRepository } from '../repositories/unlock.repository.js';
import { AppError } from '../utils/appError.js';

const TTL_DESAFIO_MS = 120_000;

const generarCodigoDosDigitos = (): string => String(Math.floor(10 + Math.random() * 90));

export class UnlockService {
  async registrarDispositivo(data: {
    codigoPatrimonial: string;
    laboratorioId: number;
    nombreEquipo?: string;
  }) {
    const codigoPatrimonial = (data.codigoPatrimonial || '').trim();
    if (!codigoPatrimonial) {
      throw new AppError('El código patrimonial del equipo es obligatorio.', 400);
    }

    const laboratorioId = Number(data.laboratorioId);
    if (!laboratorioId || Number.isNaN(laboratorioId)) {
      throw new AppError('El id del laboratorio es obligatorio.', 400);
    }

    const equipo = await prisma.equipo.findUnique({
      where: { codigoPatrimonial: codigoPatrimonial },
      include: { laboratorio: { select: { id: true, nombre: true, codigo: true } } },
    });

    if (!equipo) {
      throw new AppError('No existe un equipo con el código patrimonial indicado.', 404);
    }

    if (equipo.laboratorioId !== laboratorioId) {
      throw new AppError('El equipo no pertenece al laboratorio indicado.', 400);
    }

    if (equipo.estado === 'DE_BAJA') {
      throw new AppError('El equipo está dado de baja y no puede emparejarse a un dispositivo.', 400);
    }

    const existente = await unlockRepository.obtenerDispositivoPorEquipoId(equipo.id);
    if (existente) {
      if (existente.laboratorioId !== laboratorioId) {
        await prisma.dispositivoEscritorio.update({
          where: { id: existente.id },
          data: { laboratorioId },
        });
      }
      return {
        dispositivoId: existente.id,
        deviceToken: existente.deviceToken,
        equipo: {
          id: equipo.id,
          codigoPatrimonial: equipo.codigoPatrimonial,
          nombre: equipo.nombre,
        },
        laboratorio: { id: equipo.laboratorio.id, nombre: equipo.laboratorio.nombre },
      };
    }

    const deviceToken = crypto.randomUUID();
    const dispositivo = await unlockRepository.crearDispositivo({
      equipoId: equipo.id,
      laboratorioId,
      deviceToken,
      nombreEquipo: data.nombreEquipo ? data.nombreEquipo.trim() : null,
    });

    return {
      dispositivoId: dispositivo.id,
      deviceToken,
      equipo: {
        id: equipo.id,
        codigoPatrimonial: equipo.codigoPatrimonial,
        nombre: equipo.nombre,
      },
      laboratorio: { id: equipo.laboratorio.id, nombre: equipo.laboratorio.nombre },
    };
  }

  async bloquear(deviceToken: string) {
    if (!deviceToken) {
      throw new AppError('Debe enviar el token del dispositivo en el encabezado x-device-token.', 401);
    }

    const dispositivo = await unlockRepository.obtenerDispositivoPorToken(deviceToken.trim());
    if (!dispositivo || !dispositivo.activo) {
      throw new AppError('El dispositivo no está registrado o fue desactivado.', 401);
    }

    await unlockRepository.marcarConexion(dispositivo.id);
    await unlockRepository.cancelarDesafiosPendientes(dispositivo.equipoId);
    await unlockRepository.cerrarUsosActivosDeEquipo(dispositivo.equipoId, new Date());

    const ahora = new Date();
    const expiraEn = new Date(ahora.getTime() + TTL_DESAFIO_MS);

    let codigo = generarCodigoDosDigitos();
    for (
      let intento = 0;
      intento < 5 && (await unlockRepository.existeCodigoPendiente(codigo, dispositivo.laboratorioId, ahora));
      intento += 1
    ) {
      codigo = generarCodigoDosDigitos();
    }

    const desafio = await unlockRepository.crearDesafio({
      dispositivoId: dispositivo.id,
      equipoId: dispositivo.equipoId,
      laboratorioId: dispositivo.laboratorioId,
      codigo,
      expiraEn,
    });

    return {
      desafioId: desafio.id,
      codigo,
      expiraEn: desafio.expiraEn.toISOString(),
      equipo: {
        id: dispositivo.equipoId,
        codigoPatrimonial: dispositivo.equipo.codigoPatrimonial,
        nombre: dispositivo.equipo.nombre,
      },
      laboratorio: { id: dispositivo.laboratorioId, nombre: dispositivo.laboratorio.nombre },
    };
  }

  async consultarDesafio(deviceToken: string, desafioId: number) {
    if (!deviceToken) {
      throw new AppError('Debe enviar el token del dispositivo en el encabezado x-device-token.', 401);
    }

    const dispositivo = await unlockRepository.obtenerDispositivoPorToken(deviceToken.trim());
    if (!dispositivo || !dispositivo.activo) {
      throw new AppError('El dispositivo no está registrado o fue desactivado.', 401);
    }

    const desafio = await unlockRepository.obtenerDesafioPorId(Number(desafioId));
    if (!desafio || desafio.dispositivoId !== dispositivo.id) {
      throw new AppError('El desafío no existe para este dispositivo.', 404);
    }

    if (desafio.estado === 'ESPERANDO' && new Date(desafio.expiraEn).getTime() < Date.now()) {
      await unlockRepository.marcarExpirado(desafio.id);
      desafio.estado = 'EXPIRADO';
    }

    return {
      desafioId: desafio.id,
      estado: desafio.estado,
      expiraEn: desafio.expiraEn.toISOString(),
      tiempoRestanteMs: Math.max(0, new Date(desafio.expiraEn).getTime() - Date.now()),
      equipo: {
        id: desafio.equipo.id,
        codigoPatrimonial: desafio.equipo.codigoPatrimonial,
        nombre: desafio.equipo.nombre,
      },
      laboratorio: { id: desafio.laboratorio.id, nombre: desafio.laboratorio.nombre },
    };
  }

  async liberar(codigo: string, usuarioId: number, laboratorioId?: number) {
    const codigoLimpio = (codigo || '').trim();
    if (!/^\d{2}$/.test(codigoLimpio)) {
      throw new AppError('El código debe ser un número de 2 dígitos.', 400);
    }

    const ahora = new Date();
    const desafios = await unlockRepository.buscarDesafiosPendientesPorCodigo(
      codigoLimpio,
      ahora,
      laboratorioId !== undefined && !Number.isNaN(laboratorioId) ? Number(laboratorioId) : undefined
    );

    if (desafios.length === 0) {
      throw new AppError('El código es inválido, ya fue utilizado o ha expirado.', 404);
    }

    if (desafios.length > 1) {
      throw new AppError('El código coincide con varios equipos activos. Debe indicar el laboratorio.', 400);
    }

    const desafio = desafios[0];

    const sesion = await this.obtenerSesionActiva(desafio.laboratorioId, ahora);

    let sesionBitacoraId: number | null = null;
    let asistencia: {
      asistenciaId: number;
      estado: EstadoAsistencia;
      sesionId: number;
      materia: string;
    } | null = null;

    if (sesion && sesion.materiaId) {
      sesionBitacoraId = sesion.id;

      const inscripcion = await prisma.inscripcionMateria.findFirst({
        where: {
          estudianteId: usuarioId,
          materiaId: sesion.materiaId,
          grupo: sesion.grupo,
          gestion: sesion.gestion,
          estado: EstadoInscripcionMateria.ACTIVA,
        },
      });

      const yaMarco = inscripcion
        ? await prisma.asistenciaEstudiante.findUnique({
            where: {
              sesionBitacoraId_estudianteId: {
                sesionBitacoraId: sesion.id,
                estudianteId: usuarioId,
              },
            },
          })
        : null;

      if (inscripcion && !yaMarco && !sesion.listaConfirmada) {
        const fechaISO = sesion.fecha.toISOString().slice(0, 10);
        const fechaSesion = new Date(`${fechaISO}T${sesion.horaInicio}:00`);

        const diferenciaMinutos = (ahora.getTime() - fechaSesion.getTime()) / (1000 * 60);
        const estado: EstadoAsistencia =
          diferenciaMinutos > 15 ? EstadoAsistencia.ATRASO : EstadoAsistencia.PRESENTE;

        const asisteciaCreada = await prisma.asistenciaEstudiante.create({
          data: {
            sesionBitacoraId: sesion.id,
            estudianteId: usuarioId,
            equipoId: desafio.equipoId,
            fechaHora: ahora,
            estado,
            origen: OrigenMarcado.DESBLOQUEO_PC,
          },
        });

        asistencia = {
          asistenciaId: asisteciaCreada.id,
          estado: asisteciaCreada.estado,
          sesionId: sesion.id,
          materia: sesion.materiaNombre || sesion.materia?.nombre || 'Uso de laboratorio',
        };
      }
    }

    const uso = await unlockRepository.crearUsoEquipo({
      equipoId: desafio.equipoId,
      laboratorioId: desafio.laboratorioId,
      estudianteId: usuarioId,
      sesionBitacoraId,
      desafioId: desafio.id,
    });

    await unlockRepository.marcarLiberado(desafio.id, usuarioId);

    return {
      desafioId: desafio.id,
      estado: 'LIBERADO',
      codigo: codigoLimpio,
      usoEquipoId: uso.id,
      equipo: {
        id: desafio.equipo.id,
        codigoPatrimonial: desafio.equipo.codigoPatrimonial,
        nombre: desafio.equipo.nombre,
      },
      laboratorio: { id: desafio.laboratorio.id, nombre: desafio.laboratorio.nombre },
      sesion: sesion
        ? {
            sesionId: sesion.id,
            materia: sesion.materiaNombre || sesion.materia?.nombre || 'Uso de laboratorio',
            grupo: sesion.grupo,
            listaConfirmada: sesion.listaConfirmada,
          }
        : null,
      asistencia,
    };
  }

  private obtenerSesionActiva(laboratorioId: number, ahora: Date) {
    const year = ahora.getFullYear();
    const month = ahora.getMonth();
    const date = ahora.getDate();
    const inicio = new Date(year, month, date, 0, 0, 0, 0);
    const fin = new Date(year, month, date, 23, 59, 59, 999);

    return unlockRepository.obtenerSesionActivaEnLaboratorio(laboratorioId, inicio, fin);
  }
}

export const unlockService = new UnlockService();