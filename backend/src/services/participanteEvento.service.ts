import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/appError.js';

export const validarCodigoTransaccion = (codigo?: string | null): boolean => {
  if (!codigo || typeof codigo !== 'string') return false;
  return /^\d{6,25}$/.test(codigo.trim());
};

export const sanitizarNombrePropio = (texto?: string | null): string => {
  if (!texto || typeof texto !== 'string') return '';
  return texto
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/(?:^|\s)\S/g, (a) => a.toUpperCase());
};

export const sanitizarCorreo = (correo?: string | null): string => {
  if (!correo || typeof correo !== 'string') return '';
  return correo.trim().toLowerCase();
};

export const calcularMontoEsperado = (
  tipo: string,
  precios?: { costoEstudiante?: number | null; costoProfesional?: number | null; costoGeneral?: number | null } | null
): number => {
  const tipoUpper = (tipo || '').toUpperCase().trim();
  if (tipoUpper === 'ESTUDIANTE') {
    return Number(precios?.costoEstudiante ?? 80);
  }
  if (tipoUpper === 'PROFESIONAL' || tipoUpper === 'DOCENTE') {
    return Number(precios?.costoProfesional ?? 120);
  }
  return Number(precios?.costoGeneral ?? 100);
};

export const validarVigenciaActividad = (
  fechaFin?: Date | string | null,
  activo: boolean = true
): { valido: boolean; motivo?: string } => {
  if (!activo) {
    return { valido: false, motivo: 'La actividad se encuentra actualmente inactiva.' };
  }
  if (!fechaFin) {
    return { valido: true };
  }
  const fechaLimite = new Date(fechaFin);
  fechaLimite.setHours(23, 59, 59, 999);
  if (fechaLimite.getTime() < Date.now()) {
    return { valido: false, motivo: 'La fecha límite de la actividad ha expirado.' };
  }
  return { valido: true };
};

interface RegistrarParticipanteEventoDTO {
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  tipo: string;
  activityId?: string; // ID del congreso, taller o curso
  codigoTransaccion?: string;
  comprobanteUrl?: string;
}

export class ParticipanteEventoService {

  static async registrar(data: RegistrarParticipanteEventoDTO) {
    // Validar si la actividad existe en caso de ser provista
    if (data.activityId) {
      const actividad = await (prisma as any).activity.findUnique({
        where: { id: data.activityId },
      });
      if (!actividad) {
        throw new AppError('La actividad, curso o congreso seleccionado no existe.', 404);
      }
    }

    const participanteEvento = (prisma as any).eventoParticipante;

    const existente = await participanteEvento.findUnique({
      where: { correo: data.correo },
    });

    if (existente) {
      throw new AppError('Ya existe un registro con este correo electrónico en el sistema.', 400);
    }

    if (data.codigoTransaccion) {
      const transaccionExistente = await participanteEvento.findUnique({
        where: { codigoTransaccion: data.codigoTransaccion },
      });

      if (transaccionExistente) {
        throw new AppError('Este código de transacción ya ha sido registrado.', 400);
      }
    }

    return await participanteEvento.create({
      data: {
        nombre: data.nombre,
        apellido: data.apellido,
        correo: data.correo,
        telefono: data.telefono,
        activityId: data.activityId || null,
        codigoTransaccion: data.codigoTransaccion || null,
        comprobanteUrl: data.comprobanteUrl || null,
        estado: 'PRE_INSCRITO',
        tipo: data.tipo || 'PARTICIPANTE', // <--- Agregar el campo obligatorio tipo
      },
    });
  }

  static async obtenerConfiguracionPago() {
    const config = await (prisma as any).eventoPaymentConfig.findFirst({
      where: { activo: true },
    });

    if (!config) {
      throw new AppError('No hay una configuración de pago activa en este momento.', 404);
    }

    return config;
  }

  static async listarParticipantes() {
    return await (prisma as any).eventoParticipante.findMany({
      include: {
        activity: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async matricularManual(data: {
    nombre: string;
    apellido: string;
    correo: string;
    telefono: string;
    tipo: string;
    activityId: string;
    codigoTransaccion?: string;
    estadoPago?: string;
    observaciones?: string;
  }) {
    if (!data.nombre || !data.apellido || !data.correo || !data.activityId) {
      throw new AppError('Nombres, apellidos, correo y la actividad son campos obligatorios.', 400);
    }

    const actividad = await prisma.activity.findUnique({
      where: { id: data.activityId },
    });
    if (!actividad) {
      throw new AppError('La actividad seleccionada no existe.', 404);
    }

    const tipoNormalizado = data.tipo === 'PROFESIONAL' ? 'PROFESIONAL' : 'ESTUDIANTE';
    const estadoDefinido = (data.estadoPago || 'PAGO_VERIFICADO') as any;

    return await prisma.eventoParticipante.create({
      data: {
        nombre: data.nombre,
        apellido: data.apellido,
        correo: data.correo,
        telefono: data.telefono,
        tipo: tipoNormalizado,
        activityId: data.activityId,
        codigoTransaccion: data.codigoTransaccion || `MANUAL-${Date.now()}`,
        estado: estadoDefinido,
        observaciones: data.observaciones || 'Matriculación manual realizada por administración',
      },
      include: {
        activity: { select: { id: true, title: true } },
      },
    });
  }

  static async listarVerificadosPorActividad(activityId: string) {
    if (!activityId) {
      throw new AppError('El ID de la actividad es requerido.', 400);
    }

    return await prisma.eventoParticipante.findMany({
      where: {
        activityId,
        estado: 'PAGO_VERIFICADO',
      },
      include: {
        activity: { select: { id: true, title: true } },
      },
      orderBy: [
        { apellido: 'asc' },
        { nombre: 'asc' },
      ],
    });
  }

  static async actualizar(id: string, data: { nombre?: string; apellido?: string; correo?: string; telefono?: string }) {
    const participante = await prisma.eventoParticipante.findUnique({ where: { id } });
    if (!participante) {
      throw new AppError('Participante no encontrado.', 404);
    }
    return await prisma.eventoParticipante.update({
      where: { id },
      data,
    });
  }

  static async cambiarEstadoPago(id: string, estado: any, observaciones?: string) {
    const participante = await prisma.eventoParticipante.findUnique({ where: { id } });
    if (!participante) {
      throw new AppError('Participante no encontrado.', 404);
    }
    return await prisma.eventoParticipante.update({
      where: { id },
      data: {
        estado,
        ...(observaciones !== undefined && { observaciones }),
      },
    });
  }

  static async obtenerPorId(id: string) {
    return await prisma.eventoParticipante.findUnique({
      where: { id },
      include: { activity: true },
    });
  }
}
