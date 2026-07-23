import { Request, Response, NextFunction } from 'express';
import { EstadoIncidencia, EstadoEquipo, PrioridadIncidencia } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/appError.js';

// GET /api/incidencias
export const obtenerIncidencias = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const usuario = (req as any).user;
    let whereCondition: any = {};

    // Filtrado estricto por Ámbito Institucional si no es Administrador Global
    if (usuario && !usuario.esGlobal) {
      const carrerasUsuario: number[] = usuario.carreras || [];
      whereCondition = {
        equipo: {
          laboratorio: {
            OR: [
              { carreraId: { in: carrerasUsuario } },
              { facultad: { carreras: { some: { id: { in: carrerasUsuario } } } } },
            ],
          },
        },
      };
    }

    const incidencias = await prisma.incidencia.findMany({
      where: whereCondition,
      include: {
        equipo: { select: { id: true, codigoInventario: true, nombre: true, laboratorioId: true } },
        reportadoPor: { select: { id: true, nombre: true, correo: true } },
        asignadoA: { select: { id: true, nombre: true, correo: true } },
      },
      orderBy: { creadoEn: 'desc' },
    });

    res.status(200).json({ status: 'success', data: incidencias });
  } catch (error) {
    next(error);
  }
};

// POST /api/incidencias (Reportar Falla)
export const reportarIncidencia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { equipoId, titulo, descripcion, prioridad } = req.body;
    const usuario = (req as any).user;

    // Verificar existencia del equipo y validar ámbito
    const equipo = await prisma.equipo.findUnique({
      where: { id: Number(equipoId) },
      include: { laboratorio: true },
    });

    if (!equipo) {
      throw new AppError('El equipo especificado no existe.', 404);
    }

    if (!usuario.esGlobal) {
      const carrerasUsuario: number[] = usuario.carreras || [];
      const lab = equipo.laboratorio;

      const tieneAcceso =
        (lab.carreraId && carrerasUsuario.includes(lab.carreraId)) ||
        (await prisma.carrera.findFirst({
          where: { facultadId: lab.facultadId, id: { in: carrerasUsuario } },
        }));

      if (!tieneAcceso) {
        throw new AppError('No tiene permisos para reportar incidencias en este laboratorio.', 403);
      }
    }

    // Generar código autoincremental correlativo para la incidencia (ej. INC-2026-0001)
    const year = new Date().getFullYear();
    const count = await prisma.incidencia.count();
    const codigo = `INC-${year}-${String(count + 1).padStart(4, '0')}`;

    // Transacción: Crear Incidencia y cambiar estado del Equipo a CON_FALLA
    const [incidencia] = await prisma.$transaction([
      prisma.incidencia.create({
        data: {
          codigo,
          titulo,
          descripcion,
          prioridad: (prioridad as PrioridadIncidencia) || PrioridadIncidencia.MEDIA,
          equipoId: Number(equipoId),
          reportadoPorId: Number(usuario.id),
          estado: EstadoIncidencia.REPORTADA,
        },
      }),
      prisma.equipo.update({
        where: { id: Number(equipoId) },
        data: { estado: EstadoEquipo.CON_FALLA },
      }),
    ]);

    res.status(201).json({ status: 'success', data: incidencia });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/incidencias/:id/atender-resolver
export const actualizarEstadoIncidencia = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { estado, solucion, asignadoAId } = req.body;
    const usuario = (req as any).user;

    // Verificar existencia e inspeccionar el ámbito de la incidencia
    const incidenciaExistente = await prisma.incidencia.findUnique({
      where: { id: Number(id) },
      include: { equipo: { include: { laboratorio: true } } },
    });

    if (!incidenciaExistente) {
      throw new AppError('La incidencia no existe.', 404);
    }

    if (!usuario.esGlobal) {
      const carrerasUsuario: number[] = usuario.carreras || [];
      const lab = incidenciaExistente.equipo.laboratorio;

      const tieneAcceso =
        (lab.carreraId && carrerasUsuario.includes(lab.carreraId)) ||
        (await prisma.carrera.findFirst({
          where: { facultadId: lab.facultadId, id: { in: carrerasUsuario } },
        }));

      if (!tieneAcceso) {
        throw new AppError('No tiene permisos para modificar esta incidencia.', 403);
      }
    }

    const dataUpdate: any = { estado: estado as EstadoIncidencia };

    if (solucion) dataUpdate.solucion = solucion;
    if (asignadoAId) dataUpdate.asignadoAId = Number(asignadoAId);
    if (estado === EstadoIncidencia.RESUELTA) dataUpdate.fechaResolucion = new Date();

    const incidencia = await prisma.incidencia.update({
      where: { id: Number(id) },
      data: dataUpdate,
      include: { equipo: true },
    });

    // Sincronizar el estado del equipo si el ticket fue RESUELTO o EN_REPARACION
    if (estado === EstadoIncidencia.RESUELTA) {
      await prisma.equipo.update({
        where: { id: incidencia.equipoId },
        data: { estado: EstadoEquipo.OPERATIVO },
      });
    } else if (estado === EstadoIncidencia.EN_REPARACION) {
      await prisma.equipo.update({
        where: { id: incidencia.equipoId },
        data: { estado: EstadoEquipo.EN_MANTENIMIENTO },
      });
    }

    res.status(200).json({ status: 'success', data: incidencia });
  } catch (error) {
    next(error);
  }
};