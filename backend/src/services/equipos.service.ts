import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/appError.js';
import { EstadoActivo, Prisma } from '@prisma/client';

export interface CrearEquipoDTO {
  codigoPatrimonial?: string;
  nombre: string;
  marca?: string;
  modelo?: string;
  numeroSerie?: string;
  laboratorioId: number;
  especificaciones?: string | object;
}

export interface CrearLoteEquiposDTO {
  prefijoCodigo: string;
  correlativoInicio: number;
  cantidad: number;
  digitosCorrelativo?: number;
  nombre: string;
  marca?: string;
  modelo?: string;
  laboratorioId: number;
  especificaciones?: string | object;
}

export class EquiposService {
  /**
   * Helper privado para parsear especificaciones a tipo Json compatible con Prisma
   */
  private static parseEspecificaciones(espec: string | object | undefined): Prisma.InputJsonValue | typeof Prisma.JsonNull {
    if (!espec) return Prisma.JsonNull;
    if (typeof espec === 'string') {
      try {
        return JSON.parse(espec);
      } catch {
        return { detalle: espec };
      }
    }
    return espec as Prisma.InputJsonValue;
  }

  /**
   * Crear un único equipo individual
   */
  static async crearEquipo(data: CrearEquipoDTO) {
    if (data.codigoPatrimonial && data.codigoPatrimonial.trim()) {
      const existe = await prisma.equipo.findUnique({
        where: { codigoPatrimonial: data.codigoPatrimonial.trim() },
      });

      if (existe) {
        throw new AppError('El código patrimonial ya se encuentra registrado.', 400);
      }
    }

    return await prisma.equipo.create({
      data: {
        codigoPatrimonial: data.codigoPatrimonial?.trim() || null,
        nombre: data.nombre.trim(),
        marca: data.marca?.trim() || null,
        modelo: data.modelo?.trim() || null,
        numeroSerie: data.numeroSerie?.trim() || null,
        laboratorioId: Number(data.laboratorioId),
        especificaciones: this.parseEspecificaciones(data.especificaciones),
      },
    });
  }

  /**
   * Generar equipos masivamente por lote con correlativos automáticos
   */
  static async crearLoteEquipos(data: CrearLoteEquiposDTO) {
    const {
      prefijoCodigo,
      correlativoInicio = 1,
      cantidad,
      digitosCorrelativo = 2,
      nombre,
      marca,
      modelo,
      laboratorioId,
      especificaciones,
    } = data;

    const jsonEspecs = this.parseEspecificaciones(especificaciones);
    const equiposData = [];

    for (let i = 0; i < cantidad; i++) {
      const num = Number(correlativoInicio) + i;
      const numPadded = String(num).padStart(Number(digitosCorrelativo), '0');
      const codigoPatrimonial = `${prefijoCodigo.trim()}${numPadded}`;

      equiposData.push({
        codigoPatrimonial,
        nombre: nombre.trim(),
        marca: marca?.trim() || null,
        modelo: modelo?.trim() || null,
        laboratorioId: Number(laboratorioId),
        especificaciones: jsonEspecs,
        estado: EstadoActivo.OPERATIVO,
      });
    }

    const resultado = await prisma.equipo.createMany({
      data: equiposData,
      skipDuplicates: true,
    });

    return {
      mensaje: `Se procesó el lote correctamente. Equipos insertados: ${resultado.count}.`,
      count: resultado.count,
    };
  }

  /**
   * Obtener todos los equipos pertenecientes a un laboratorio
   */
  static async obtenerEquiposPorLaboratorio(laboratorioId: number) {
    return await prisma.equipo.findMany({
      where: { laboratorioId: Number(laboratorioId) },
      orderBy: { id: 'asc' },
    });
  }

  /**
   * Cambiar el estado operativo de un equipo específico
   */
  static async cambiarEstado(
    equipoId: number,
    estado: EstadoActivo | string
  ) {
    return await prisma.equipo.update({
      where: { id: Number(equipoId) },
      data: { estado: estado as EstadoActivo },
    });
  }
}