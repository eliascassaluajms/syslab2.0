import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/prisma.js';
import { ScopeService } from '../services/scope.service.js';
import { timeToMinutes } from '../services/horario.service.js';

const obtenerContextoHorario = (ahora: Date) => {
  const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const horaActual = ahora.getHours() * 60 + ahora.getMinutes();
  return { diaSemana: diasSemana[ahora.getDay()], horaActual };
};

export const obtenerMisHorariosActivos = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const docenteId = Number((req as any).user?.id);
    const ahora = new Date();
    const { diaSemana, horaActual } = obtenerContextoHorario(ahora);
    const horarios = await prisma.horario.findMany({
      where: { docenteId, diaSemana, gestion: ahora.getFullYear() },
      include: {
        laboratorio: { select: { id: true, nombre: true, codigo: true } },
        materia: { select: { id: true, nombre: true, codigo: true } },
      },
      orderBy: { horaInicio: 'asc' },
    });
    const horariosActivos = horarios.filter((horario) => (
      horaActual >= timeToMinutes(horario.horaInicio) - 15 &&
      horaActual <= timeToMinutes(horario.horaFin) - 10
    ));
    const laboratorios = Array.from(new Map(horariosActivos.map((horario) => [horario.laboratorio.id, horario.laboratorio])).values());
    res.status(200).json({ status: 'success', data: { materias: horariosActivos, laboratorios } });
  } catch (error) {
    next(error);
  }
};

export const obtenerMisReservasAprobadasHoy = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const docenteId = Number((req as any).user?.id);
    const ahora = new Date();
    const inicioDia = new Date(Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()));
    const finDia = new Date(Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59));
    const { horaActual } = obtenerContextoHorario(ahora);
    const reservas = await prisma.solicitudHorarioExtraordinario.findMany({
      where: { docenteId, estado: 'APROBADO', fecha: { gte: inicioDia, lte: finDia } },
      include: {
        laboratorio: { select: { id: true, nombre: true, codigo: true } },
        docente: { select: { id: true, nombre: true, apellido: true } },
      },
      orderBy: { horaInicio: 'asc' },
    });
    const reservasActivas = reservas.filter((reserva) => (
      horaActual >= timeToMinutes(reserva.horaInicio) - 15 &&
      horaActual <= timeToMinutes(reserva.horaFin) - 10
    ));
    res.status(200).json({ status: 'success', data: reservasActivas });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 1. OBTENER LABORATORIOS (FILTRADO POR ÁMBITO)
// ==========================================
export const obtenerLaboratorios = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const usuario = (req as any).user;

    let whereCondition: any = {};

    // Si el usuario no es Administrador Global, aplicamos el filtro de ámbito
    if (usuario && !usuario.esGlobal) {
      if (usuario.ambitoId && usuario.tipoAmbito) {
        // Obtenemos los IDs de carreras según el ámbito (FACULTAD o CARRERA)
        const carreraIds = await ScopeService.resolverCarrerasPorAmbito(
          usuario.ambitoId,
          usuario.tipoAmbito
        );

        whereCondition = {
          OR: [
            { carreraId: { in: carreraIds } },
            // También incluimos laboratorios de ámbito general de la Facultad (carreraId null)
            { facultadId: usuario.facultadId, carreraId: null },
          ],
        };
      } else if (usuario.facultadId) {
        whereCondition = { facultadId: usuario.facultadId };
      }
    }

    const laboratorios = await prisma.laboratorio.findMany({
      where: whereCondition,
      include: {
        facultad: {
          select: { id: true, nombre: true, sigla: true },
        },
        carrera: {
          select: { id: true, nombre: true },
        },
      },
      orderBy: { id: 'asc' },
    });

    res.status(200).json({ status: 'success', data: laboratorios });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. CREAR NUEVO LABORATORIO
// ==========================================
export const crearLaboratorio = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { nombre, codigo, ubicacion, capacidad, descripcion, facultadId, carreraId } = req.body;

    const nuevoLab = await prisma.laboratorio.create({
      data: {
        nombre,
        codigo,
        ubicacion,
        capacidad: capacidad ? Number(capacidad) : 0,
        descripcion,
        facultadId: Number(facultadId),
        carreraId: carreraId ? Number(carreraId) : null,
        activo: true,
      },
      include: {
        facultad: { select: { id: true, nombre: true, sigla: true } },
        carrera: { select: { id: true, nombre: true } },
      },
    });

    res.status(201).json({ status: 'success', data: nuevoLab });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. ACTUALIZAR LABORATORIO
// ==========================================
export const actualizarLaboratorio = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { nombre, codigo, ubicacion, capacidad, descripcion, facultadId, carreraId } = req.body;

    const labActualizado = await prisma.laboratorio.update({
      where: { id: Number(id) },
      data: {
        nombre,
        codigo,
        ubicacion,
        capacidad: capacidad ? Number(capacidad) : 0,
        descripcion,
        facultadId: facultadId ? Number(facultadId) : undefined,
        carreraId: carreraId !== undefined ? (carreraId ? Number(carreraId) : null) : undefined,
      },
      include: {
        facultad: { select: { id: true, nombre: true, sigla: true } },
        carrera: { select: { id: true, nombre: true } },
      },
    });

    res.status(200).json({ status: 'success', data: labActualizado });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 4. ELIMINACIÓN LÓGICA (CAMBIO DE ESTADO)
// ==========================================
export const cambiarEstadoLaboratorio = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    const labEstado = await prisma.laboratorio.update({
      where: { id: Number(id) },
      data: { activo: Boolean(activo) },
    });

    res.status(200).json({
      status: 'success',
      message: `El laboratorio ha sido ${labEstado.activo ? 'activado' : 'desactivado'} correctamente.`,
      data: labEstado,
    });
  } catch (error) {
    next(error);
  }
};
// ==========================================
// 5. OBTENER ESTADO ACTUAL EN TIEMPO REAL (CON ÁMBITO)
// ==========================================
export const obtenerEstadoLaboratoriosReal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const usuario = (req as any).user;
    let whereCondition: any = { activo: true };

    // Aplicar el mismo filtro de ámbito institucional
    if (usuario && !usuario.esGlobal) {
      if (usuario.ambitoId && usuario.tipoAmbito) {
        const carreraIds = await ScopeService.resolverCarrerasPorAmbito(
          usuario.ambitoId,
          usuario.tipoAmbito
        );

        whereCondition.OR = [
          { carreraId: { in: carreraIds } },
          { facultadId: usuario.facultadId, carreraId: null },
        ];
      } else if (usuario.facultadId) {
        whereCondition.facultadId = usuario.facultadId;
      }
    }

    // Obtener la fecha/hora actual del servidor
    const ahora = new Date();
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const diaActual = diasSemana[ahora.getDay()];

    const horas = String(ahora.getHours()).padStart(2, '0');
    const minutos = String(ahora.getMinutes()).padStart(2, '0');
    const horaActualStr = `${horas}:${minutos}`;

    // Consultar laboratorios filtrados con sus horarios activos
    const laboratorios = await prisma.laboratorio.findMany({
      where: whereCondition,
      include: {
        facultad: { select: { nombre: true, sigla: true } },
        carrera: { select: { nombre: true } },
        horarios: {
          where: {
            diaSemana: diaActual,
            horaInicio: { lte: horaActualStr },
            horaFin: { gte: horaActualStr }
          },
          include: {
            materia: { select: { nombre: true, codigo: true } },
            docente: { select: { nombre: true } }
          }
        }
      },
      orderBy: { id: 'asc' }
    });

    // Mapear al formato requerido por el frontend
    const estadoLabs = laboratorios.map(lab => {
      const claseEnCurso = (lab.horarios as any[])[0];

      if (claseEnCurso) {
        const materiaNombre = claseEnCurso?.materia?.nombre ?? 'Materia desconocida';
        const materiaCodigo = claseEnCurso?.materia?.codigo ?? '';
        const docenteNombre = claseEnCurso?.docente?.nombre ?? 'Docente no asignado';

        return {
          id: lab.id,
          nombre: lab.nombre,
          ubicacion: lab.ubicacion || 'Campus Universitario',
          carrera: lab.carrera?.nombre || 'General / Facultad',
          estado: 'Occupied',
          actividadActual: `Clase: ${materiaNombre}${materiaCodigo ? ` (${materiaCodigo})` : ''} - Doc: ${docenteNombre}`
        };
      }

      return {
        id: lab.id,
        nombre: lab.nombre,
        ubicacion: lab.ubicacion || 'Campus Universitario',
        carrera: lab.carrera?.nombre || 'General / Facultad',
        estado: 'Available',
        actividadActual: 'Sin actividades programadas en este momento.'
      };
    });

    res.status(200).json({ status: 'success', data: estadoLabs });
  } catch (error) {
    next(error);
  }
};