import { prisma } from '../config/prisma.js';
import { asistenciaRepository } from '../repositories/asistencia.repository.js';
import { bitacoraRepository } from '../repositories/bitacora.repository.js';
import { AppError } from '../utils/appError.js';

export interface DTORegistrarAsistencia {
  tokenQR: string;
  estudianteId: number;
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

    // 3. Verifica que el estudianteId exista en la tabla Usuario
    const estudiante = await prisma.usuario.findUnique({
      where: { id: Number(estudianteId) },
      select: { id: true, nombre: true, apellido: true, correo: true },
    });

    if (!estudiante) {
      throw new AppError('El estudiante especificado no se encuentra registrado en el sistema.', 404);
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
}

export const asistenciaService = new AsistenciaService();
