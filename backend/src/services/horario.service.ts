import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/appError.js';
import * as XLSX from 'xlsx';

type ExcelCell = string | number | boolean | Date | null | undefined;
type ExcelRow = ExcelCell[];

interface ImportarHorarioResultado {
  importados: number;
  omitidos: number;
  errores: string[];
}

const normalizarTextoExcel = (valor: ExcelCell): string => String(valor ?? '').trim();

const normalizarClaveExcel = (valor: ExcelCell): string => normalizarTextoExcel(valor)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const buscarIndiceColumna = (encabezados: string[], opciones: string[]): number => {
  const indice = encabezados.findIndex((encabezado) => opciones.includes(encabezado));
  return indice;
};

const normalizarDia = (valor: string): string | null => {
  const dia = normalizarClaveExcel(valor);
  const dias: Record<string, string> = {
    domingo: 'Domingo', lunes: 'Lunes', martes: 'Martes', miercoles: 'Miércoles',
    jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sábado'
  };
  return dias[dia] || null;
};

const extraerSemestre = (valor: string): number | null => {
  const coincidencia = valor.match(/(?:nivel|semestre)\s*([1-9][0-9]?)/i);
  return coincidencia ? Number(coincidencia[1]) : null;
};

const normalizarHora = (valor: string): string | null => {
  const coincidencia = valor.trim().match(/^(\d{1,2})(?::|\.)(\d{2})$/);
  if (!coincidencia) return null;
  const horas = Number(coincidencia[1]);
  const minutos = Number(coincidencia[2]);
  if (horas > 23 || minutos > 59) return null;
  return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
};

const extraerRangoHorario = (valor: string): { horaInicio: string; horaFin: string } | null => {
  const coincidencia = valor.match(/(\d{1,2}(?:[:.]\d{2})?)\s*(?:-|–|—|a|hasta)\s*(\d{1,2}(?:[:.]\d{2})?)/i);
  if (!coincidencia) return null;
  const horaInicio = normalizarHora(coincidencia[1].replace('.', ':'));
  const horaFin = normalizarHora(coincidencia[2].replace('.', ':'));
  return horaInicio && horaFin ? { horaInicio, horaFin } : null;
};

const encontrarEncabezados = (filas: ExcelRow[]): { indice: number; encabezados: string[] } => {
  const claves = ['codigo', 'sigla', 'materia', 'docente', 'profesor', 'laboratorio', 'aula', 'dia', 'hora inicio'];
  for (let indice = 0; indice < Math.min(filas.length, 25); indice += 1) {
    const encabezados = filas[indice].map(normalizarClaveExcel);
    const coincidencias = encabezados.filter((encabezado) => claves.some((clave) => encabezado.includes(clave)));
    if (coincidencias.length >= 2) return { indice, encabezados };
  }
  throw new AppError('No se encontró una fila de encabezados reconocible en la hoja 29-07.', 400);
};

export type HorarioConflictCandidate = {
  id?: number;
  laboratorioId: number;
  docenteId: number;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  grupo?: number;
  totalGrupos?: number;
  materiaId?: number;
};

export const timeToMinutes = (time: string): number => {
  const [hours, minutes] = (time || '00:00').split(':').map(Number);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new AppError('La hora del horario es inválida. Use el formato HH:MM.', 400);
  }

  return hours * 60 + minutes;
};

export const haySolapamientoHorario = (
  inicioA: string,
  finA: string,
  inicioB: string,
  finB: string
): boolean => {
  const inicio1 = timeToMinutes(inicioA);
  const fin1 = timeToMinutes(finA);
  const inicio2 = timeToMinutes(inicioB);
  const fin2 = timeToMinutes(finB);

  if (fin1 <= inicio1 || fin2 <= inicio2) {
    throw new AppError('El rango horario debe tener una hora de inicio menor a la de finalización.', 400);
  }

  return inicio1 < fin2 && inicio2 < fin1;
};

export const validarNoConflictoHorario = ({
  laboratorioId,
  docenteId,
  diaSemana,
  horaInicio,
  horaFin,
  horarioExistente,
  excludeId,
}: {
  laboratorioId: number;
  docenteId: number;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  horarioExistente: HorarioConflictCandidate[];
  excludeId?: number;
}): boolean => {
  const dia = diaSemana?.trim();

  if (!dia) {
    return false;
  }

  for (const horario of horarioExistente) {
    if (excludeId && horario.id === excludeId) {
      continue;
    }

    if (horario.diaSemana?.trim().toLowerCase() !== dia.toLowerCase()) {
      continue;
    }

    if (
      Number(horario.laboratorioId) !== Number(laboratorioId) &&
      Number(horario.docenteId) !== Number(docenteId)
    ) {
      continue;
    }

    try {
      if (haySolapamientoHorario(horaInicio, horaFin, horario.horaInicio, horario.horaFin)) {
        return false;
      }
    } catch {
      return false;
    }
  }

  return true;
};

export class HorarioService {
  private normalizarGrupo(grupo?: number, totalGrupos?: number) {
    const grupoNormalizado = Number(grupo ?? 1);
    const totalNormalizado = Number(totalGrupos ?? 1);

    if (!Number.isInteger(grupoNormalizado) || grupoNormalizado < 1) {
      throw new AppError('El grupo debe ser un número entero mayor o igual a 1.', 400);
    }

    if (!Number.isInteger(totalNormalizado) || totalNormalizado < 1) {
      throw new AppError('El total de grupos debe ser un número entero mayor o igual a 1.', 400);
    }

    if (grupoNormalizado > totalNormalizado) {
      throw new AppError('El número de grupo no puede ser mayor al total de grupos.', 400);
    }

    return { grupo: grupoNormalizado, totalGrupos: totalNormalizado };
  }

  private async validarEntidades({
    laboratorioId,
    docenteId,
    materiaId,
  }: {
    laboratorioId: number;
    docenteId: number;
    materiaId: number;
  }) {
    const laboratorio = await prisma.laboratorio.findUnique({
      where: { id: laboratorioId },
    });

    if (!laboratorio || !laboratorio.activo) {
      throw new AppError('El laboratorio indicado no existe o está inactivo.', 404);
    }

    const docente = await prisma.usuario.findUnique({
      where: { id: docenteId },
    });

    if (!docente || !docente.activo) {
      throw new AppError('El docente indicado no existe o está inactivo.', 404);
    }

    const materia = await prisma.materia.findUnique({
      where: { id: materiaId },
    });

    if (!materia) {
      throw new AppError('La materia indicada no existe.', 404);
    }
  }

  private async validarConflictos({
    laboratorioId,
    docenteId,
    diaSemana,
    horaInicio,
    horaFin,
    excludeId,
  }: {
    laboratorioId: number;
    docenteId: number;
    diaSemana: string;
    horaInicio: string;
    horaFin: string;
    excludeId?: number;
  }) {
    const horariosExistentes = await prisma.horario.findMany({
      where: {
        diaSemana,
        OR: [{ laboratorioId }, { docenteId }],
      },
      select: {
        id: true,
        laboratorioId: true,
        docenteId: true,
        diaSemana: true,
        horaInicio: true,
        horaFin: true,
        grupo: true,
        totalGrupos: true,
        materiaId: true,
      },
    });

    const hayConflicto = !validarNoConflictoHorario({
      laboratorioId,
      docenteId,
      diaSemana,
      horaInicio,
      horaFin,
      horarioExistente: horariosExistentes,
      excludeId,
    });

    if (hayConflicto) {
      throw new AppError(
        'El horario solicitado choca con otra asignación del mismo laboratorio o del mismo docente en el mismo día y horario.',
        409
      );
    }
  }

  async crear(data: {
    laboratorioId: number;
    materiaId: number;
    docenteId: number;
    diaSemana: string;
    horaInicio: string;
    horaFin: string;
    semestre: number;
    gestion: number;
    grupo?: number;
    totalGrupos?: number;
  }) {
    const laboratorioId = Number(data.laboratorioId);
    const materiaId = Number(data.materiaId);
    const docenteId = Number(data.docenteId);
    const semestre = Number(data.semestre);
    const gestion = Number(data.gestion);

    if (!data.diaSemana?.trim()) {
      throw new AppError('El día de la semana es obligatorio.', 400);
    }

    if (!data.horaInicio || !data.horaFin) {
      throw new AppError('Las horas de inicio y fin son obligatorias.', 400);
    }

    if (Number.isNaN(laboratorioId) || Number.isNaN(materiaId) || Number.isNaN(docenteId)) {
      throw new AppError('Los identificadores de laboratorio, materia y docente deben ser válidos.', 400);
    }

    if (Number.isNaN(semestre) || Number.isNaN(gestion)) {
      throw new AppError('El semestre y la gestión deben ser números válidos.', 400);
    }

    const { grupo, totalGrupos } = this.normalizarGrupo(data.grupo, data.totalGrupos);

    await this.validarEntidades({ laboratorioId, docenteId, materiaId });
    await this.validarConflictos({
      laboratorioId,
      docenteId,
      diaSemana: data.diaSemana,
      horaInicio: data.horaInicio,
      horaFin: data.horaFin,
    });

    return prisma.horario.create({
      data: {
        laboratorioId,
        materiaId,
        docenteId,
        diaSemana: data.diaSemana,
        horaInicio: data.horaInicio,
        horaFin: data.horaFin,
        grupo,
        totalGrupos,
        semestre,
        gestion,
      },
      include: {
        laboratorio: { select: { id: true, nombre: true, codigo: true } },
        materia: { select: { id: true, nombre: true, codigo: true } },
        docente: { select: { id: true, nombre: true, apellido: true } },
      },
    });
  }

  async importarExcel(buffer: Buffer, gestion = new Date().getFullYear()): Promise<ImportarHorarioResultado> {
    const libro = XLSX.read(buffer, { type: 'buffer', cellDates: true });
    
    // Buscar la hoja '29-07' con tolerancia a espacios o casing, o usar la primera si solo hay una
    let nombreHoja = libro.SheetNames.find(
      (nombre) => nombre.trim().toLowerCase() === '29-07'
    );
    if (!nombreHoja) {
      nombreHoja = libro.SheetNames.find((nombre) => nombre.toLowerCase().includes('29-07'));
    }
    if (!nombreHoja && libro.SheetNames.length > 0) {
      nombreHoja = libro.SheetNames[0];
    }

    const hoja = nombreHoja ? libro.Sheets[nombreHoja] : undefined;

    if (!hoja) {
      throw new AppError('El archivo Excel no contiene hojas procesables o la hoja 29-07.', 400);
    }

    const filas = XLSX.utils.sheet_to_json<ExcelRow>(hoja, { header: 1, defval: '' });
    const { indice: indiceEncabezados, encabezados } = encontrarEncabezados(filas);
    const indiceCodigo = buscarIndiceColumna(encabezados, ['codigo', 'sigla', 'codigo materia', 'sigla materia']);
    const indiceMateria = encabezados.findIndex((encabezado) => encabezado.includes('materia') && !encabezado.includes('codigo'));
    const indiceLaboratorio = encabezados.findIndex((encabezado) => encabezado.includes('laboratorio') || encabezado.includes('aula'));
    const indiceDocente = encabezados.findIndex((encabezado) => encabezado.includes('docente') || encabezado.includes('profesor'));
    const indiceDia = buscarIndiceColumna(encabezados, ['dia', 'dia semana', 'dias']);
    const indiceHoraInicio = buscarIndiceColumna(encabezados, ['hora inicio', 'inicio']);
    const indiceHoraFin = buscarIndiceColumna(encabezados, ['hora fin', 'fin']);
    const indiceRango = encabezados.findIndex((encabezado) => encabezado.includes('horario') || encabezado.includes('rango horario'));

    let semestreActual: number | null = null;
    let laboratorioAnterior = '';
    let docenteAnterior = '';
    let importados = 0;
    let omitidos = 0;
    const errores: string[] = [];

    const obtenerCodigoMateria = (valor: string): string => {
      const codigo = valor.match(/[A-ZÁÉÍÓÚÑ]{2,}[A-ZÁÉÍÓÚÑ0-9-]*\d[A-ZÁÉÍÓÚÑ0-9-]*/i);
      return codigo ? codigo[0].toUpperCase() : valor.trim();
    };

    for (let indiceFila = indiceEncabezados + 1; indiceFila < filas.length; indiceFila += 1) {
      const fila = filas[indiceFila];
      const valoresFila = fila.map(normalizarTextoExcel);
      const semestreDetectado = valoresFila.map(extraerSemestre).find((valor): valor is number => valor !== null);
      if (semestreDetectado !== undefined) semestreActual = semestreDetectado;

      const laboratorioCelda = indiceLaboratorio >= 0 ? valoresFila[indiceLaboratorio] : '';
      const docenteCelda = indiceDocente >= 0 ? valoresFila[indiceDocente] : '';
      if (laboratorioCelda) laboratorioAnterior = laboratorioCelda;
      if (docenteCelda) docenteAnterior = docenteCelda;

      const materiaTexto = indiceCodigo >= 0
        ? valoresFila[indiceCodigo]
        : (indiceMateria >= 0 ? valoresFila[indiceMateria] : '');
      const codigoMateria = obtenerCodigoMateria(materiaTexto);
      if (!codigoMateria || !semestreActual || !laboratorioAnterior || !docenteAnterior) continue;

      const bloques: Array<{ diaSemana: string; rango: { horaInicio: string; horaFin: string } }> = [];
      const diaFila = indiceDia >= 0 ? normalizarDia(valoresFila[indiceDia]) : null;
      const rangoFila = indiceRango >= 0 ? extraerRangoHorario(valoresFila[indiceRango]) : null;
      const horasSeparadas = indiceHoraInicio >= 0 && indiceHoraFin >= 0
        ? { horaInicio: normalizarHora(valoresFila[indiceHoraInicio]), horaFin: normalizarHora(valoresFila[indiceHoraFin]) }
        : null;

      if (diaFila && (rangoFila || (horasSeparadas?.horaInicio && horasSeparadas.horaFin))) {
        bloques.push({
          diaSemana: diaFila,
          rango: rangoFila || { horaInicio: horasSeparadas?.horaInicio || '', horaFin: horasSeparadas?.horaFin || '' },
        });
      } else {
        for (let indiceColumna = 0; indiceColumna < encabezados.length; indiceColumna += 1) {
          const diaColumna = normalizarDia(encabezados[indiceColumna]);
          const rango = diaColumna ? extraerRangoHorario(valoresFila[indiceColumna]) : null;
          if (diaColumna && rango) bloques.push({ diaSemana: diaColumna, rango });
        }
      }

      if (bloques.length === 0) continue;

      const materia = await prisma.materia.findUnique({ where: { codigo: codigoMateria } });
      const laboratorio = await prisma.laboratorio.findFirst({
        where: {
          activo: true,
          OR: [
            { codigo: { contains: laboratorioAnterior, mode: 'insensitive' } },
            { nombre: { contains: laboratorioAnterior, mode: 'insensitive' } },
          ],
        },
      });
      const docente = await prisma.usuario.findFirst({
        where: {
          activo: true,
          OR: [
            { correo: { equals: docenteAnterior, mode: 'insensitive' } },
            { nombre: { contains: docenteAnterior.split(/\s+/)[0], mode: 'insensitive' } },
            { apellido: { contains: docenteAnterior.split(/\s+/).slice(-1)[0], mode: 'insensitive' } },
          ],
        },
      });

      if (!materia || !laboratorio || !docente) {
        omitidos += bloques.length;
        errores.push(`Fila ${indiceFila + 1}: no se pudo resolver materia, laboratorio o docente.`);
        continue;
      }

      for (const bloque of bloques) {
        try {
          await this.crear({
            laboratorioId: laboratorio.id,
            materiaId: materia.id,
            docenteId: docente.id,
            diaSemana: bloque.diaSemana,
            horaInicio: bloque.rango.horaInicio,
            horaFin: bloque.rango.horaFin,
            semestre: semestreActual,
            gestion: Number(gestion),
          });
          importados += 1;
        } catch (error) {
          omitidos += 1;
          const mensaje = error instanceof AppError ? error.message : 'No se pudo crear el horario.';
          errores.push(`Fila ${indiceFila + 1}: ${mensaje}`);
        }
      }
    }

    return { importados, omitidos, errores: errores.slice(0, 50) };
  }

  async listar(filters?: { docenteId?: number; laboratorioId?: number; diaSemana?: string; semestre?: number; gestion?: number }) {
    const where: Record<string, unknown> = {};

    if (filters?.docenteId) where.docenteId = Number(filters.docenteId);
    if (filters?.laboratorioId) where.laboratorioId = Number(filters.laboratorioId);
    if (filters?.diaSemana) where.diaSemana = filters.diaSemana;
    if (filters?.semestre) where.semestre = Number(filters.semestre);
    if (filters?.gestion) where.gestion = Number(filters.gestion);

    return prisma.horario.findMany({
      where,
      include: {
        laboratorio: { select: { id: true, nombre: true, codigo: true } },
        materia: { select: { id: true, nombre: true, codigo: true } },
        docente: { select: { id: true, nombre: true, apellido: true } },
      },
      orderBy: [{ diaSemana: 'asc' }, { horaInicio: 'asc' }],
    });
  }

  async obtenerPorId(id: number) {
    const horario = await prisma.horario.findUnique({
      where: { id },
      include: {
        laboratorio: { select: { id: true, nombre: true, codigo: true } },
        materia: { select: { id: true, nombre: true, codigo: true } },
        docente: { select: { id: true, nombre: true, apellido: true } },
      },
    });

    if (!horario) {
      throw new AppError('El horario solicitado no existe.', 404);
    }

    return horario;
  }

  async actualizar(
    id: number,
    data: {
      laboratorioId?: number;
      materiaId?: number;
      docenteId?: number;
      diaSemana?: string;
      horaInicio?: string;
      horaFin?: string;
      semestre?: number;
      gestion?: number;
      grupo?: number;
      totalGrupos?: number;
    }
  ) {
    const horarioActual = await this.obtenerPorId(id);

    const laboratorioId = Number(data.laboratorioId ?? horarioActual.laboratorioId);
    const materiaId = Number(data.materiaId ?? horarioActual.materiaId);
    const docenteId = Number(data.docenteId ?? horarioActual.docenteId);
    const diaSemana = data.diaSemana ?? horarioActual.diaSemana;
    const horaInicio = data.horaInicio ?? horarioActual.horaInicio;
    const horaFin = data.horaFin ?? horarioActual.horaFin;
    const semestre = Number(data.semestre ?? horarioActual.semestre);
    const gestion = Number(data.gestion ?? horarioActual.gestion);
    const { grupo, totalGrupos } = this.normalizarGrupo(data.grupo ?? horarioActual.grupo, data.totalGrupos ?? horarioActual.totalGrupos);

    await this.validarEntidades({ laboratorioId, docenteId, materiaId });
    await this.validarConflictos({
      laboratorioId,
      docenteId,
      diaSemana,
      horaInicio,
      horaFin,
      excludeId: id,
    });

    return prisma.horario.update({
      where: { id },
      data: {
        laboratorioId,
        materiaId,
        docenteId,
        diaSemana,
        horaInicio,
        horaFin,
        grupo,
        totalGrupos,
        semestre,
        gestion,
      },
      include: {
        laboratorio: { select: { id: true, nombre: true, codigo: true } },
        materia: { select: { id: true, nombre: true, codigo: true } },
        docente: { select: { id: true, nombre: true, apellido: true } },
      },
    });
  }

  async eliminar(id: number) {
    await this.obtenerPorId(id);

    return prisma.horario.delete({
      where: { id },
    });
  }

  async obtenerDisponibilidad({
    fecha,
    horaInicio,
    horaFin,
    usuarioId,
    esGlobal = false,
  }: {
    fecha: string;
    horaInicio: string;
    horaFin: string;
    usuarioId?: number;
    esGlobal?: boolean;
  }) {
    if (!fecha || !horaInicio || !horaFin) {
      throw new AppError('Debe proporcionar fecha, horaInicio y horaFin.', 400);
    }

    const reqInicioMin = timeToMinutes(horaInicio);
    const reqFinMin = timeToMinutes(horaFin);
    if (reqFinMin <= reqInicioMin) {
      throw new AppError('La hora de inicio debe ser menor a la hora de fin.', 400);
    }

    const parts = fecha.split('-');
    if (parts.length !== 3) {
      throw new AppError('Formato de fecha inválido. Debe ser YYYY-MM-DD.', 400);
    }
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);

    if (isNaN(year) || isNaN(month) || isNaN(day)) {
      throw new AppError('Fecha inválida.', 400);
    }

    const dateObj = new Date(year, month - 1, day);
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const diaSemanaNombre = diasSemana[dateObj.getDay()];

    // 1. Obtener IDs de laboratorios ocupados en Horarios Regulares
    const todosHorarios = await prisma.horario.findMany({
      where: {
        diaSemana: {
          equals: diaSemanaNombre,
          mode: 'insensitive',
        },
      },
      select: {
        laboratorioId: true,
        horaInicio: true,
        horaFin: true,
      },
    });

    const labsOcupadosHorarios = new Set<number>();
    for (const h of todosHorarios) {
      try {
        if (haySolapamientoHorario(horaInicio, horaFin, h.horaInicio, h.horaFin)) {
          labsOcupadosHorarios.add(h.laboratorioId);
        }
      } catch {
        // ignora
      }
    }

    // 2. Obtener IDs de laboratorios ocupados en SolicitudHorarioExtraordinario (APROBADO)
    const fechaInicioDia = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
    const fechaFinDia = new Date(Date.UTC(year, month - 1, day, 23, 59, 59));

    const solicitudesAprobadas = await prisma.solicitudHorarioExtraordinario.findMany({
      where: {
        fecha: {
          gte: fechaInicioDia,
          lte: fechaFinDia,
        },
        estado: { in: ['APROBADO', 'PENDIENTE'] },
      },
      select: {
        laboratorioId: true,
        horaInicio: true,
        horaFin: true,
      },
    });

    const labsOcupadosSolicitudes = new Set<number>();
    for (const sol of solicitudesAprobadas) {
      try {
        if (haySolapamientoHorario(horaInicio, horaFin, sol.horaInicio, sol.horaFin)) {
          labsOcupadosSolicitudes.add(sol.laboratorioId);
        }
      } catch {
        // ignora
      }
    }

    // 3. Unión de IDs ocupados
    const idsOcupados = Array.from(
      new Set([...Array.from(labsOcupadosHorarios), ...Array.from(labsOcupadosSolicitudes)])
    );

    // Retorna la lista de laboratorios cuyos IDs NO estén en la lista de ocupados
    const laboratorioWhere: any = {
      activo: true,
      id: { notIn: idsOcupados },
    };

    if (usuarioId && !esGlobal) {
      const asignaciones = await prisma.asignacionAmbito.findMany({
        where: { usuarioId },
        select: { carreraId: true, facultadId: true },
      });
      const carrerasIds = asignaciones
        .map((asignacion) => asignacion.carreraId)
        .filter((id): id is number => id !== null);
      const facultadesIds = asignaciones
        .map((asignacion) => asignacion.facultadId)
        .filter((id): id is number => id !== null);

      laboratorioWhere.OR = [
        ...(carrerasIds.length > 0 ? [{ carreraId: { in: carrerasIds } }] : []),
        ...(facultadesIds.length > 0 ? [{ facultadId: { in: facultadesIds }, carreraId: null }] : []),
      ];
    }

    return prisma.laboratorio.findMany({
      where: laboratorioWhere,
      orderBy: { nombre: 'asc' },
    });
  }

  async esLaboratorioDisponible({
    laboratorioId,
    fecha,
    horaInicio,
    horaFin,
    excludeSolicitudId,
    usuarioId,
    esGlobal = false,
  }: {
    laboratorioId: number;
    fecha: string | Date;
    horaInicio: string;
    horaFin: string;
    excludeSolicitudId?: number;
    usuarioId?: number;
    esGlobal?: boolean;
  }): Promise<boolean> {
    const fechaStr = typeof fecha === 'string' 
      ? fecha.split('T')[0] 
      : fecha.toISOString().split('T')[0];

    const labsDisponibles = await this.obtenerDisponibilidad({
      fecha: fechaStr,
      horaInicio,
      horaFin,
      usuarioId,
      esGlobal,
    });

    const estaDisponible = labsDisponibles.some((lab) => lab.id === laboratorioId);
    if (estaDisponible) return true;

    if (excludeSolicitudId) {
      const parts = fechaStr.split('-');
      const year = Number(parts[0]);
      const month = Number(parts[1]);
      const day = Number(parts[2]);
      const dateObj = new Date(year, month - 1, day);
      const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const diaSemanaNombre = diasSemana[dateObj.getDay()];

      const horarios = await prisma.horario.findMany({
        where: {
          laboratorioId,
          diaSemana: { equals: diaSemanaNombre, mode: 'insensitive' },
        },
      });
      for (const h of horarios) {
        if (haySolapamientoHorario(horaInicio, horaFin, h.horaInicio, h.horaFin)) {
          return false;
        }
      }

      const fechaInicioDia = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
      const fechaFinDia = new Date(Date.UTC(year, month - 1, day, 23, 59, 59));
      const solicitudes = await prisma.solicitudHorarioExtraordinario.findMany({
        where: {
          laboratorioId,
          fecha: { gte: fechaInicioDia, lte: fechaFinDia },
          estado: 'APROBADO',
          id: { not: excludeSolicitudId },
        },
      });
      for (const sol of solicitudes) {
        if (haySolapamientoHorario(horaInicio, horaFin, sol.horaInicio, sol.horaFin)) {
          return false;
        }
      }
      return true;
    }

    return false;
  }
}

export const horarioService = new HorarioService();
