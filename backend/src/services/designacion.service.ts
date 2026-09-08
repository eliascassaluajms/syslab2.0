import { prisma } from '../config/prisma.js';
import { TipoPeriodoDesignacion } from '@prisma/client';
import { AppError } from '../utils/appError.js';

interface CrearDesignacionDTO {
  docenteId: number;
  materiaId: number;
  grupo: number;
  gestion: number;
  tipoPeriodo: string;
}

export class DesignacionService {
  static async crearOActualizar(data: CrearDesignacionDTO) {
    const { docenteId, materiaId, grupo, gestion, tipoPeriodo } = data;

    const periodoDesignacion: TipoPeriodoDesignacion = 
      tipoPeriodo.toLowerCase() === 'anual' 
        ? TipoPeriodoDesignacion.ANUAL 
        : TipoPeriodoDesignacion.SEMESTRE_1;

    const docente = await prisma.usuario.findUnique({ where: { id: docenteId } });
    if (!docente) {
      throw new AppError('El docente especificado no existe en el sistema.', 404);
    }

    const materia = await prisma.materia.findUnique({ where: { id: materiaId } });
    if (!materia) {
      throw new AppError('La materia especificada no existe en el sistema.', 404);
    }

    const designacion = await prisma.designacionMateria.upsert({
      where: {
        docenteId_materiaId_grupo_gestion_periodo: {
          docenteId,
          materiaId,
          grupo,
          gestion,
          periodo: periodoDesignacion
        }
      },
      update: { activo: true },
      create: {
        docenteId,
        materiaId,
        grupo,
        gestion,
        periodo: periodoDesignacion,
        activo: true
      },
      include: {
        docente: { select: { id: true, nombre: true, apellido: true, correo: true } },
        materia: { select: { id: true, codigo: true, nombre: true, tipoPeriodo: true } }
      }
    });

    return designacion;
  }

  static async listarPorGestion(gestion: number) {
    return await prisma.designacionMateria.findMany({
      where: { gestion },
      include: {
        docente: { select: { id: true, nombre: true, apellido: true, correo: true } },
        materia: { select: { id: true, codigo: true, nombre: true, tipoPeriodo: true } }
      },
      orderBy: { creadoEn: 'desc' }
    });
  }

  static async eliminar(id: number) {
    const existe = await prisma.designacionMateria.findUnique({ where: { id } });
    if (!existe) {
      throw new AppError('La designación solicitada no fue encontrada.', 404);
    }

    return await prisma.designacionMateria.delete({
      where: { id }
    });
  }
}
