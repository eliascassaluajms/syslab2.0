import { Prisma } from '@prisma/client';
import { createRequire } from 'node:module';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/appError.js';

const require = createRequire(import.meta.url);

export type RolTribunal = 'PRESIDENTE' | 'SECRETARIO' | 'VOCAL' | 'TRIBUNAL';

export type TribunalInput = {
  docenteId?: number;
  rol?: RolTribunal;
  preside?: boolean;
  esExterno?: boolean;
  institucionProcedencia?: string;
  // Datos del tribunal externo (creación automática de usuario con rol "Tribunal Externo")
  nombre?: string;
  apellido?: string;
  correo?: string;
  ci?: string;
};

export type TrabajoGradoCreateInput = {
  titulo: string;
  modalidad: string;
  gradoOptado: string;
  carreraId: number;
  gestion?: number;
  materiaId?: number;
  estudianteNombre: string;
  estudianteCi: string;
  estudianteRu: string;
  estudianteEmail: string;
  estudianteTelefono?: string;
  estudianteUsuarioId?: number;
};

export const DIAS_HABILES_OBSERVACIONES = 5;

export const validarAsignacionTribunal = (tribunales: TribunalInput[]) => {
  const errores: string[] = [];

  if (!Array.isArray(tribunales) || tribunales.length !== 2) {
    return { valido: false, errores: ['Debe designar exactamente 2 tribunales.'] };
  }

  const ids = new Set<number>();
  const presides = tribunales.filter((t) => Boolean(t.preside)).length;

  if (presides > 1) {
    errores.push('Solo un tribunal puede presidir el acto de defensa (Vicedecano o Director de Carrera).');
  }

  for (const tribunal of tribunales) {
    const rol = (tribunal.rol || 'TRIBUNAL').toUpperCase();
    if (!['TRIBUNAL', 'PRESIDENTE', 'SECRETARIO', 'VOCAL'].includes(rol)) {
      errores.push('Cada tribunal requiere un rol válido.');
    }

    if (tribunal.docenteId && Number(tribunal.docenteId) > 0) {
      const id = Number(tribunal.docenteId);
      if (ids.has(id)) {
        errores.push('Un mismo docente no puede integrar el tribunal dos veces.');
      }
      ids.add(id);
    } else if (tribunal.esExterno) {
      if (!tribunal.nombre?.trim() || !tribunal.apellido?.trim() || !tribunal.correo?.trim()) {
        errores.push('El tribunal externo requiere nombre, apellido y correo electrónico.');
      }
    } else {
      errores.push('Cada tribunal interno requiere un docente válido.');
    }
  }

  return { valido: errores.length === 0, errores };
};

export const resumirEstadoTrabajo = (trabajo: {
  estado?: string;
  versionesDocumento?: Array<{ id: string }>;
  observaciones?: Array<{ id: string }>;
  tribunales?: Array<{ rol?: string; preside?: boolean }>;
}) => {
  const preside = trabajo.tribunales?.find((t) => t.preside)?.rol;
  return {
    estado: trabajo.estado ?? 'REGISTRADO',
    versiones: trabajo.versionesDocumento?.length ?? 0,
    observaciones: trabajo.observaciones?.length ?? 0,
    tribunales: trabajo.tribunales?.length ?? 0,
    preside,
  };
};

const buildPdfBuffer = async (docDefinition: any) => {
  const pdfmake = require('pdfmake/js/index.js');

  pdfmake.addFonts({
    Helvetica: {
      normal: 'Helvetica',
      bold: 'Helvetica-Bold',
      italics: 'Helvetica-Oblique',
      bolditalics: 'Helvetica-BoldOblique',
    },
  });

  const doc = pdfmake.createPdf({
    ...docDefinition,
    defaultStyle: { font: 'Helvetica', ...(docDefinition.defaultStyle || {}) },
  });
  return doc.getBuffer() as Promise<Buffer>;
};

const sumarDiasHabiles = (fecha: Date, dias: number): Date => {
  const result = new Date(fecha);
  let agregados = 0;
  while (agregados < dias) {
    result.setDate(result.getDate() + 1);
    const dia = result.getDay();
    if (dia !== 0 && dia !== 6) agregados += 1;
  }
  return result;
};

const obtenerCarrera = async (carreraId: number) => {
  const carrera = await prisma.carrera.findUnique({ where: { id: Number(carreraId) } });
  if (!carrera) {
    throw new AppError('La carrera especificada no existe.', 404);
  }
  return carrera;
};

const obtenerProximoNumeroMemorandum = async (carreraId: number, gestion: number): Promise<string> => {
  let control = await prisma.controlMemorandum.findUnique({
    where: { carreraId_gestion: { carreraId, gestion } },
  });
  if (!control) {
    control = await prisma.controlMemorandum.create({ data: { carreraId, gestion, ultimoNumero: 0 } });
  }
  const numero = control.ultimoNumero + 1;
  await prisma.controlMemorandum.update({
    where: { id: control.id },
    data: { ultimoNumero: numero },
  });
  return `M-${String(gestion)}-${String(numero).padStart(3, '0')}`;
};

const crearTribunalExterno = async (data: {
  nombre: string;
  apellido: string;
  correo: string;
  ci?: string;
  carreraId: number;
}) => {
  const rolExterno = await prisma.rol.findUnique({ where: { nombre: 'Tribunal Externo' } });
  if (!rolExterno) {
    throw new AppError('El rol "Tribunal Externo" no está configurado. Ejecute el seeder de seguridad.', 500);
  }

  const baseApellido = data.apellido
    .trim()
    .split(' ')[0]
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
  const usernameBase = `tribunal.${data.nombre.trim().charAt(0).toLowerCase()}${baseApellido}`;
  let username = usernameBase;
  let contador = 1;
  while (await prisma.usuario.findUnique({ where: { username } })) {
    contador += 1;
    username = `${usernameBase}${contador}`;
  }

  const correo = data.correo.trim().toLowerCase();
  if (await prisma.usuario.findUnique({ where: { correo } })) {
    throw new AppError('Ya existe un usuario registrado con ese correo electrónico.', 400);
  }

  const password = `${crypto.randomBytes(4).toString('hex')}A1!`;

  const usuario = await prisma.usuario.create({
    data: {
      nombre: data.nombre.trim(),
      apellido: data.apellido.trim(),
      username,
      correo,
      password: await bcrypt.hash(password, 10),
      rolId: rolExterno.id,
      activo: true,
      esGlobal: false,
      asignacionesRoles: {
        create: { rolId: rolExterno.id, carreraId: data.carreraId },
      },
    },
  });

  return { usuarioId: usuario.id, username, password };
};

const formatearFecha = (fecha: Date): string => {
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];
  return `${fecha.getDate()} de ${meses[fecha.getMonth()]} de ${fecha.getFullYear()}`;
};

const guardarDocumento = (nombre: string, buffer: Buffer): string => {
  const dir = path.join(process.cwd(), 'uploads', 'trabajos');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(path.join(dir, nombre), buffer);
  return `/api/documentos/trabajos/${nombre}`;
};

export const defensaService = {
  async listarTrabajos(
    filtros: {
      carreraId?: number;
      estado?: string;
      gestion?: number;
      usuarioId?: number;
      roles?: string[];
      carreras?: number[];
      soloMios?: boolean;
    } = {}
  ) {
    const esTribunalExterno = Array.isArray(filtros.roles) && filtros.roles.includes('Tribunal Externo');
    const esVisibilidadRestringida = esTribunalExterno || Boolean(filtros.soloMios);

    const where: Prisma.TrabajoGradoWhereInput = {};
    if (filtros.carreraId) {
      where.carreraId = Number(filtros.carreraId);
    } else if (Array.isArray(filtros.carreras) && filtros.carreras.length > 0) {
      where.carreraId = { in: filtros.carreras };
    }
    if (filtros.estado) {
      where.estado = filtros.estado as any;
    }
    if (filtros.gestion) {
      where.gestion = Number(filtros.gestion);
    }
    if (esVisibilidadRestringida && filtros.usuarioId) {
      where.tribunales = { some: { docenteId: filtros.usuarioId } };
    }

    const trabajos = await prisma.trabajoGrado.findMany({
      where,
      include: {
        carrera: true,
        materia: true,
        tribunales: {
          include: { docente: { select: { id: true, nombre: true, apellido: true, correo: true } } },
        },
        versionesDocumento: { orderBy: { fechaSubida: 'desc' } },
        observaciones: { orderBy: { creadoEn: 'desc' } },
      },
      orderBy: [{ gestion: 'desc' }, { creadoEn: 'desc' }],
    });

    return trabajos.map((trabajo) => ({
      ...trabajo,
      esTribunal: Boolean(filtros.usuarioId && trabajo.tribunales.some((t) => t.docenteId === filtros.usuarioId)),
    }));
  },

  async crearTrabajo(data: TrabajoGradoCreateInput) {
    const titulo = data.titulo?.trim();
    const estudianteNombre = data.estudianteNombre?.trim();
    if (!titulo || !estudianteNombre || !data.carreraId) {
      throw new AppError('Faltan datos obligatorios para registrar el trabajo de grado.', 400);
    }

    await obtenerCarrera(data.carreraId);

    const gestion = data.gestion ? Number(data.gestion) : new Date().getFullYear();

    const trabajo = await prisma.trabajoGrado.create({
      data: {
        titulo,
        modalidad: data.modalidad?.trim() || 'Trabajo Dirigido',
        gradoOptado: data.gradoOptado?.trim() || 'Licenciatura en Ingeniería Informática',
        carreraId: Number(data.carreraId),
        gestion,
        materiaId: data.materiaId ? Number(data.materiaId) : null,
        estudianteNombre,
        estudianteCi: data.estudianteCi?.trim() || 'Sin CI',
        estudianteRu: data.estudianteRu?.trim() || 'Sin RU',
        estudianteEmail: data.estudianteEmail?.trim() || 'sin-email@uajms.edu.bo',
        estudianteTelefono: data.estudianteTelefono?.trim() || null,
        estudianteUsuarioId: data.estudianteUsuarioId ? Number(data.estudianteUsuarioId) : null,
        estado: 'REGISTRADO',
      },
      include: { carrera: true, materia: true },
    });

    return trabajo;
  },

  async obtenerTrabajoPorId(id: string) {
    const trabajo = await prisma.trabajoGrado.findUnique({
      where: { id },
      include: {
        carrera: true,
        tribunales: {
          include: {
            docente: {
              select: { id: true, nombre: true, apellido: true, correo: true, rol: { select: { nombre: true } } },
            },
          },
        },
        versionesDocumento: { orderBy: { fechaSubida: 'desc' } },
        observaciones: { include: { designacion: true }, orderBy: { creadoEn: 'desc' } },
        actaDefensa: true,
      },
    });

    if (!trabajo) {
      throw new AppError('No se encontró el trabajo de grado solicitado.', 404);
    }

    return trabajo;
  },

  async actualizarTrabajo(
    id: string,
    data: Partial<{
      titulo: string;
      modalidad: string;
      gradoOptado: string;
      gestion: number;
      carreraId: number;
      estudianteNombre: string;
      estudianteCi: string;
      estudianteRu: string;
      estudianteEmail: string;
      estudianteTelefono: string;
    }>
  ) {
    const trabajoActual = await this.obtenerTrabajoPorId(id);

    return prisma.trabajoGrado.update({
      where: { id },
      data: {
        titulo: data.titulo?.trim() ?? trabajoActual.titulo,
        modalidad: data.modalidad?.trim() ?? trabajoActual.modalidad,
        gradoOptado: data.gradoOptado?.trim() ?? trabajoActual.gradoOptado,
        estudianteNombre: data.estudianteNombre?.trim() ?? trabajoActual.estudianteNombre,
        estudianteCi: data.estudianteCi?.trim() ?? trabajoActual.estudianteCi,
        estudianteRu: data.estudianteRu?.trim() ?? trabajoActual.estudianteRu,
        estudianteEmail: data.estudianteEmail?.trim() ?? trabajoActual.estudianteEmail,
        estudianteTelefono: data.estudianteTelefono?.trim() ?? trabajoActual.estudianteTelefono,
        carreraId: data.carreraId ? Number(data.carreraId) : trabajoActual.carreraId,
        gestion: data.gestion ? Number(data.gestion) : trabajoActual.gestion,
      },
    });
  },

  async eliminarTrabajo(id: string) {
    await this.obtenerTrabajoPorId(id);
    await prisma.trabajoGrado.delete({ where: { id } });
    return { eliminado: true };
  },

  async asignarTribunales(trabajoId: string, tribunales: TribunalInput[]) {
    const validacion = validarAsignacionTribunal(tribunales);
    if (!validacion.valido) {
      throw new AppError(validacion.errores.join(' '), 400);
    }

    const trabajo = await prisma.trabajoGrado.findUnique({
      where: { id: trabajoId },
      include: { tribunales: true },
    });
    if (!trabajo) {
      throw new AppError('El trabajo de grado no existe.', 404);
    }

    const hayConformidades = trabajo.tribunales.some((t) => t.estadoRevision === 'CONFORME');
    if (hayConformidades) {
      throw new AppError('No puede modificar el tribunal porque ya existe una conformidad emitida.', 400);
    }

    const gestion = trabajo.gestion || new Date().getFullYear();
    const fechaEmision = new Date();
    const fechaLimite = sumarDiasHabiles(fechaEmision, DIAS_HABILES_OBSERVACIONES);

    await this.eliminarDesignaciones(trabajoId);

    const credencialesExternos: Array<{ nombre: string; username: string; password: string }> = [];

    for (const tribunal of tribunales) {
      let docenteId = tribunal.docenteId ? Number(tribunal.docenteId) : undefined;
      let username = '';
      let password = '';

      if (tribunal.esExterno && !docenteId) {
        const credenciales = await crearTribunalExterno({
          nombre: tribunal.nombre || '',
          apellido: tribunal.apellido || '',
          correo: tribunal.correo || '',
          ci: tribunal.ci,
          carreraId: trabajo.carreraId,
        });
        docenteId = credenciales.usuarioId;
        username = credenciales.username;
        password = credenciales.password;
      }

      if (!docenteId) {
        throw new AppError('No se pudo resolver el tribunal seleccionado.', 400);
      }

      const numeroMemorandum = await obtenerProximoNumeroMemorandum(trabajo.carreraId, gestion);

      await prisma.designacionTribunal.create({
        data: {
          trabajoGradoId: trabajoId,
          docenteId,
          rol: 'TRIBUNAL',
          preside: Boolean(tribunal.preside),
          esExterno: Boolean(tribunal.esExterno),
          institucionProcedencia: tribunal.institucionProcedencia?.trim() || null,
          numeroMemorandum,
          fechaEmisionMemo: fechaEmision,
          fechaLimiteObservaciones: fechaLimite,
        },
      });

      if (username) {
        credencialesExternos.push({
          nombre: `${tribunal.nombre?.trim()} ${tribunal.apellido?.trim()}`.trim(),
          username,
          password,
        });
      }
    }

    await prisma.trabajoGrado.update({
      where: { id: trabajoId },
      data: { estado: 'TRIBUNAL_DESIGNADO' },
    });

    const trabajoResultado = await this.obtenerTrabajoPorId(trabajoId);
    return { trabajo: trabajoResultado, credencialesExternos };
  },

  async eliminarDesignaciones(trabajoId: string) {
    await prisma.designacionTribunal.deleteMany({ where: { trabajoGradoId: trabajoId } });
  },

  async registrarVersion(trabajoId: string, archivoUrl: string, descripcionCambios?: string) {
    const trabajo = await prisma.trabajoGrado.findUnique({ where: { id: trabajoId } });
    if (!trabajo) {
      throw new AppError('El trabajo de grado no existe.', 404);
    }

    const ultimaVersion = await prisma.versionDocumento.findFirst({
      where: { trabajoGradoId: trabajoId },
      orderBy: { numeroVersion: 'desc' },
      select: { numeroVersion: true },
    });

    return prisma.versionDocumento.create({
      data: {
        trabajoGradoId: trabajoId,
        numeroVersion: (ultimaVersion?.numeroVersion ?? 0) + 1,
        archivoUrl,
        descripcionCambios: descripcionCambios?.trim() || null,
      },
    });
  },

  async registrarObservacion(
    trabajoId: string,
    designacionId: string,
    detalleObservacion: string,
    archivoCorreccionesUrl?: string,
    esExtraordinaria = false
  ) {
    if (!detalleObservacion?.trim() && !archivoCorreccionesUrl?.trim()) {
      throw new AppError('Debe adjuntar un texto de observación o un archivo de correcciones.', 400);
    }

    const designacion = await prisma.designacionTribunal.findUnique({ where: { id: designacionId } });
    if (!designacion || designacion.trabajoGradoId !== trabajoId) {
      throw new AppError('La designación de tribunal no pertenece a este trabajo.', 400);
    }
    if (designacion.estadoRevision === 'CONFORME') {
      throw new AppError('No puede observar un trabajo sobre el cual ya emitió conformidad.', 400);
    }

    const totalObservaciones = await prisma.observacionTribunal.count({
      where: { trabajoGradoId: trabajoId, designacionId },
    });

    if (esExtraordinaria) {
      if (totalObservaciones === 0) {
        throw new AppError('Debe existir al menos una observación ordinaria antes de la ronda extraordinaria.', 400);
      }
      const extraordinariasUsadas = await prisma.observacionTribunal.count({
        where: { designacionId, esExtraordinaria: true },
      });
      if (extraordinariasUsadas > 0) {
        throw new AppError('Solo se permite una ronda extraordinaria de observaciones por tribunal.', 400);
      }
    }

    const numeroRevision = totalObservaciones + 1;

    const observacion = await prisma.observacionTribunal.create({
      data: {
        trabajoGradoId: trabajoId,
        designacionId,
        numeroRevision,
        detalleObservacion: detalleObservacion.trim() || 'Observación con archivo adjunto.',
        archivoCorreccionesUrl: archivoCorreccionesUrl?.trim() || null,
        esExtraordinaria,
      },
    });

    await prisma.designacionTribunal.update({
      where: { id: designacionId },
      data: { estadoRevision: 'OBSERVADO' },
    });

    await prisma.trabajoGrado.update({
      where: { id: trabajoId },
      data: { estado: 'CON_OBSERVACIONES' },
    });

    return observacion;
  },

  async actualizarFechaLimite(trabajoId: string, designacionId: string, fecha: string) {
    const fechaLimite = new Date(fecha);
    if (isNaN(fechaLimite.getTime())) {
      throw new AppError('Debe enviar una fecha límite válida.', 400);
    }

    const designacion = await prisma.designacionTribunal.findUnique({ where: { id: designacionId } });
    if (!designacion || designacion.trabajoGradoId !== trabajoId) {
      throw new AppError('La designación de tribunal no pertenece a este trabajo.', 400);
    }

    return prisma.designacionTribunal.update({
      where: { id: designacionId },
      data: { fechaLimiteObservaciones: fechaLimite },
    });
  },

  async emitirConformidad(trabajoId: string, designacionId: string) {
    const designacion = await prisma.designacionTribunal.findUnique({
      where: { id: designacionId },
      include: {
        docente: { select: { id: true, nombre: true, apellido: true } },
        trabajoGrado: true,
      },
    });

    if (!designacion || designacion.trabajoGradoId !== trabajoId) {
      throw new AppError('No es posible emitir la conformidad para esta designación.', 400);
    }
    if (designacion.estadoRevision === 'CONFORME') {
      return prisma.designacionTribunal.findUnique({ where: { id: designacionId } });
    }

    const cartaConformidadUrl = await this.generarCartaConformidad(designacion);

    await prisma.designacionTribunal.update({
      where: { id: designacionId },
      data: {
        estadoRevision: 'CONFORME',
        fechaConformidad: new Date(),
        cartaConformidadUrl,
      },
    });

    const trabajo = await prisma.trabajoGrado.findUnique({
      where: { id: trabajoId },
      include: { tribunales: true },
    });

    const tribunalesConformes = trabajo?.tribunales ?? [];
    if (
      trabajo &&
      tribunalesConformes.length > 0 &&
      tribunalesConformes.every((t) => t.estadoRevision === 'CONFORME')
    ) {
      await prisma.trabajoGrado.update({
        where: { id: trabajoId },
        data: { estado: 'APTO_PARA_DEFENSA' },
      });
    }

    return prisma.designacionTribunal.findUnique({
      where: { id: designacionId },
      include: { trabajoGrado: true },
    });
  },

  async generarCartaConformidad(designacion: {
    id: string;
    numeroMemorandum: string | null;
    profesor?: { nombre?: string; apellido?: string } | null;
    nombre?: string;
    apellido?: string;
    trabajoGrado?: { id?: string; titulo?: string; estudianteNombre?: string; estudianteCi?: string; estudianteRu?: string } | null;
    docente?: { nombre?: string; apellido?: string } | null;
  }) {
    const remitente =
      designacion.docente?.nombre && designacion.docente?.apellido
        ? `${designacion.docente.nombre} ${designacion.docente.apellido}`.trim()
        : designacion.nombre && designacion.apellido
          ? `${designacion.nombre} ${designacion.apellido}`.trim()
          : 'el Tribunal Evaluador';

    const docDefinition = {
      pageSize: 'LETTER',
      pageMargins: [50, 50, 50, 50],
      content: [
        { text: 'UNIVERSIDAD AUTÓNOMA JUAN MISAEL SARACHO', bold: true, fontSize: 12, alignment: 'center', margin: [0, 0, 0, 2] },
        { text: 'FACULTAD DE CIENCIAS INTEGRADAS DE YACUIBA', fontSize: 10, alignment: 'center', margin: [0, 0, 0, 40] },
        { text: 'CARTA DE CONFORMIDAD', bold: true, fontSize: 13, alignment: 'center', margin: [0, 0, 0, 30] },
        {
          text: 'Señor:\nDecano en ejercicio de la Facultad de Ciencias Integradas de Yacuiba\nPresente. -',
          fontSize: 11,
          lineHeight: 1.4,
          margin: [0, 0, 0, 25],
        },
        { text: 'De mi consideración:', fontSize: 11, margin: [0, 0, 0, 14] },
        {
          text: `Yo, ${remitente}, en mi calidad de miembro del Tribunal Evaluador designado mediante Memorándum N° ${designacion.numeroMemorandum || '—'}, me dirijo a su autoridad para hacer constar mi CONFORMIDAD con el Trabajo de Grado titulado “${designacion.trabajoGrado?.titulo || ''}”, presentado por el/la universitario(a) ${designacion.trabajoGrado?.estudianteNombre || ''} (C.I.: ${designacion.trabajoGrado?.estudianteCi || ''} · R.U.: ${designacion.trabajoGrado?.estudianteRu || ''}), declarando que el documento se encuentra APTO PARA INGRESAR AL PROCEDIMIENTO DE DEFENSA FINAL de la modalidad de graduación, en el marco del reglamento vigente.`,
          fontSize: 11,
          lineHeight: 1.6,
          alignment: 'justify',
          margin: [0, 0, 0, 40],
        },
        { text: 'Atentamente,', fontSize: 11, margin: [0, 0, 0, 10] },
        { text: '_______________________________', alignment: 'center', margin: [0, 55, 0, 0] },
        { text: remitente, alignment: 'center', bold: true, fontSize: 11, margin: [0, 8, 0, 2] },
        { text: 'Miembro del Tribunal Evaluador', alignment: 'center', fontSize: 10, margin: [0, 0, 0, 2] },
        { text: `Yacuiba, ${formatearFecha(new Date())}`, alignment: 'center', fontSize: 10 },
      ],
    };

    const buffer = await buildPdfBuffer(docDefinition);
    return guardarDocumento(`carta-conformidad-${designacion.id}.pdf`, buffer);
  },

  generarActaPdfBufferDefinition(trabajo: any) {
    const tribunalPreside = trabajo.tribunales.find((t: any) => t.preside);
    const tribunalOtro = trabajo.tribunales.find((t: any) => t.id !== tribunalPreside?.id);

    const nombrePreside = tribunalPreside
      ? `${tribunalPreside.docente?.nombre || ''} ${tribunalPreside.docente?.apellido || ''}`.trim()
      : '';
    const nombreOtro = tribunalOtro
      ? `${tribunalOtro.docente?.nombre || ''} ${tribunalOtro.docente?.apellido || ''}`.trim()
      : '';

    return {
      pageSize: 'LETTER',
      pageMargins: [40, 40, 40, 40],
      content: [
        { text: 'UNIVERSIDAD AUTÓNOMA JUAN MISAEL SARACHO', bold: true, fontSize: 13, alignment: 'center', margin: [0, 0, 0, 2] },
        { text: 'FACULTAD DE CIENCIAS INTEGRADAS DE YACUIBA', fontSize: 11, alignment: 'center', margin: [0, 0, 0, 15] },
        { text: 'ACTA DE DEFENSA FINAL DE GRADO', bold: true, fontSize: 15, alignment: 'center', margin: [0, 0, 0, 15] },
        { text: 'En la ciudad de Yacuiba, a horas ______:______ del día ______ de ____________ de 20____, en ambientes de la Facultad de Ciencias Integradas de Yacuiba, se realizó la defensa final del Trabajo de Grado de la modalidad de graduación.', fontSize: 11, alignment: 'justify', lineHeight: 1.4, margin: [0, 0, 0, 14] },
        { text: `Postulante: ${trabajo.estudianteNombre}`, fontSize: 11, margin: [0, 0, 0, 4] },
        { text: `C.I.: ${trabajo.estudianteCi} | R.U.: ${trabajo.estudianteRu}`, fontSize: 11, margin: [0, 0, 0, 8] },
        { text: `Título del Trabajo de Grado: “${trabajo.titulo}”`, fontSize: 11, margin: [0, 0, 0, 8] },
        { text: `Carrera: ${trabajo.carrera?.nombre || 'Sin carrera'} | Grado Académico: ${trabajo.gradoOptado}`, fontSize: 11, margin: [0, 0, 0, 14] },
        { text: 'CALIFICACIÓN (Reglamento de la Modalidad de Graduación — Taller III)', bold: true, fontSize: 11, margin: [0, 0, 0, 10] },
        {
          table: {
            headerRows: 1,
            widths: ['*', '25%', '*'],
            body: [
              [
                { text: 'Criterio', bold: true, fillColor: '#eeeeee' },
                { text: 'Puntaje', bold: true, fillColor: '#eeeeee' },
                { text: '', fillColor: '#eeeeee' },
              ],
              [{ text: 'Evaluación continua' }, { text: '__ / 50' }, { text: '' }],
              [{ text: 'Defensa final' }, { text: '__ / 50' }, { text: '' }],
              [{ text: 'Nota final', bold: true }, { text: '__ / 100', bold: true }, { text: '' }],
              [{ text: 'Calificación literal', bold: true }, { text: '____________', bold: true }, { text: 'Excelente (80-100) · Distinguido (70-79) · Suficiente (51-69) · Reprobado (0-50)', fontSize: 8 }],
              [{ text: 'Veredicto', bold: true }, { text: '[ ] APROBADO   [ ] REPROBADO', bold: true }, { text: 'Aprobado con nota final ≥ 51', fontSize: 8 }],
            ],
          },
          margin: [0, 0, 0, 18],
        },
        { text: 'Siendo las ______ horas, se dio por concluida la defensa final, firmando en constancia los miembros del Tribunal Evaluador, el Vicedecano o Director de Carrera que presidió el acto y el Director de la Carrera.', fontSize: 10, alignment: 'justify', lineHeight: 1.4, margin: [0, 0, 0, 20] },
        {
          columns: [
            {
              width: '*',
              stack: [
                { text: 'PRESIDENTE', bold: true },
                { text: nombrePreside || 'Vicedecano / Director de Carrera que presidió', fontSize: 10, margin: [0, 4, 0, 0] },
                { text: '________________________________', margin: [0, 24, 0, 0] },
                { text: 'Firma', fontSize: 9, italics: true },
              ],
            },
            {
              width: '*',
              stack: [
                { text: 'TRIBUNAL', bold: true },
                { text: nombreOtro || 'Miembro del Tribunal Evaluador', fontSize: 10, margin: [0, 4, 0, 0] },
                { text: '________________________________', margin: [0, 24, 0, 0] },
                { text: 'Firma', fontSize: 9, italics: true },
              ],
            },
            {
              width: '*',
              stack: [
                { text: 'DIRECTOR DE CARRERA', bold: true },
                { text: trabajo.carrera?.nombre || 'Director de Carrera', fontSize: 10, margin: [0, 4, 0, 0] },
                { text: '________________________________', margin: [0, 24, 0, 0] },
                { text: 'Firma', fontSize: 9, italics: true },
              ],
            },
          ],
        },
      ],
    };
  },

  async generarActa(trabajoId: string) {
    const trabajo = await this.obtenerTrabajoPorId(trabajoId);

    if (!trabajo) {
      throw new AppError('El trabajo de grado no existe.', 404);
    }

    const conformes = trabajo.tribunales.every((tribunal) => tribunal.estadoRevision === 'CONFORME');
    if (!conformes) {
      throw new AppError('Debe existir la conformidad de los dos tribunales para generar el acta.', 400);
    }

    const ultimo = await prisma.actaDefensa.findFirst({
      orderBy: { fechaGeneracion: 'desc' },
      select: { codigoActa: true },
    });

    const numero = Number((ultimo?.codigoActa?.match(/(\d+)$/)?.[1] ?? '0')) + 1;
    const codigoActa = `ACTA-${new Date().getFullYear()}-${String(numero).padStart(4, '0')}`;

    const acta = await prisma.actaDefensa.upsert({
      where: { trabajoGradoId: trabajoId },
      update: { codigoActa, fechaGeneracion: new Date() },
      create: {
        trabajoGradoId: trabajoId,
        codigoActa,
        fechaGeneracion: new Date(),
      },
    });

    await prisma.trabajoGrado.update({
      where: { id: trabajoId },
      data: { estado: 'DEFENSA_PROGRAMADA' },
    });

    return acta;
  },

  async generarMemorandumPdf(trabajoId: string, designacionId: string) {
    const trabajo = await this.obtenerTrabajoPorId(trabajoId);
    const designacion = trabajo.tribunales.find((item) => item.id === designacionId);
    if (!designacion) {
      throw new AppError('La designación de tribunal especificada no existe.', 404);
    }

    const fechaLimite = designacion.fechaLimiteObservaciones
      ? formatearFecha(new Date(designacion.fechaLimiteObservaciones))
      : '______ de ______________ de 20____';

    const docDefinition = {
      pageSize: 'LETTER',
      pageMargins: [40, 40, 40, 40],
      content: [
        { text: 'UNIVERSIDAD AUTÓNOMA JUAN MISAEL SARACHO', bold: true, fontSize: 14, alignment: 'center', margin: [0, 0, 0, 10] },
        { text: 'FACULTAD DE CIENCIAS INTEGRADAS DE YACUIBA', fontSize: 11, alignment: 'center', margin: [0, 0, 0, 20] },
        { text: 'MEMORÁNDUM DE DESIGNACIÓN DE TRIBUNAL EVALUADOR', bold: true, fontSize: 13, alignment: 'center', margin: [0, 0, 0, 10] },
        { text: `N° ${designacion.numeroMemorandum || 'M-______'}`, fontSize: 10, margin: [0, 0, 0, 15] },
        {
          text: `La Dirección de la Carrera de ${trabajo.carrera?.nombre || 'la carrera'}, en el marco del Reglamento de la Modalidad de Graduación vigente, tiene a bien DESIGNAR al/la Lic. ${designacion.docente?.nombre || '____________________'} ${designacion.docente?.apellido || ''}, como miembro del TRIBUNAL EVALUADOR del Trabajo de Grado titulado “${trabajo.titulo}”, elaborado y presentado por el/la universitario(a) ${trabajo.estudianteNombre}, para optar al grado académico de ${trabajo.gradoOptado}.`,
          fontSize: 11,
          lineHeight: 1.5,
          alignment: 'justify',
          margin: [0, 0, 0, 14],
        },
        {
          text: designacion.preside
            ? `A efectos del acto de defensa, el/la designado(a) presidirá la mesa en calidad de Vicedecano o Director de Carrera, conforme lo establece el reglamento.`
            : `Asimismo, se le comunica que el/la señor(a) podrá presidir la mesa de defensa de conformidad con lo establecido en el reglamento.`,
          fontSize: 10,
          italic: true,
          margin: [0, 0, 0, 14],
        },
        {
          text: `Plazo perentorio: el/la tribunal tendrá un plazo de CINCO (5) DÍAS HÁBILES, computables a partir de la presente notificación, esto es, hasta el ${fechaLimite}, para remitir a la Dirección de Carrera sus observaciones al documento y, en su caso, la carta de conformidad correspondiente.`,
          fontSize: 11,
          lineHeight: 1.5,
          alignment: 'justify',
          margin: [0, 0, 0, 16],
        },
        { text: 'Con atención de los requisitos formales y plazos reglamentarios vigentes.', fontSize: 10, margin: [0, 0, 0, 20] },
        { text: 'Atentamente,', fontSize: 11, margin: [0, 0, 0, 8] },
        { text: '_______________________________', alignment: 'right', margin: [0, 60, 0, 0] },
        { text: 'Firma y sello del Director de Carrera', alignment: 'right', fontSize: 10, margin: [0, 8, 0, 0] },
        { text: `Yacuiba, ${fechaEmisionTexto()}`, alignment: 'left', fontSize: 10, margin: [0, 2, 0, 0] },
      ],
    };

    return buildPdfBuffer(docDefinition);
  },

  async generarActaPdf(trabajoId: string) {
    const trabajo = await this.obtenerTrabajoPorId(trabajoId);

    const docDefinition = this.generarActaPdfBufferDefinition(trabajo);
    return buildPdfBuffer(docDefinition);
  },

  async obtenerControlMemorandum(carreraId: number) {
    const gestionActual = new Date().getFullYear();
    const control = await prisma.controlMemorandum.findUnique({
      where: { carreraId_gestion: { carreraId: Number(carreraId), gestion: gestionActual } },
    });
    return {
      carreraId: Number(carreraId),
      gestion: gestionActual,
      ultimoNumero: control?.ultimoNumero ?? 0,
    };
  },

  async actualizarControlMemorandum(carreraId: number, gestion: number, ultimoNumero: number) {
    if (!Number.isFinite(ultimoNumero) || ultimoNumero < 0) {
      throw new AppError('El último número de memorándum debe ser un entero mayor o igual a cero.', 400);
    }
    await obtenerCarrera(carreraId);
    const control = await prisma.controlMemorandum.upsert({
      where: { carreraId_gestion: { carreraId: Number(carreraId), gestion: Number(gestion) } },
      update: { ultimoNumero: Number(ultimoNumero) },
      create: { carreraId: Number(carreraId), gestion: Number(gestion), ultimoNumero: Number(ultimoNumero) },
    });
    return control;
  },

  async obtenerEstudiantesElegibles(filtros: {
    carreraId: number;
    materiaId?: number;
    gestion?: number;
    busqueda?: string;
    todos?: boolean;
  }) {
    const { carreraId, materiaId, busqueda, todos } = filtros;
    const cid = Number(carreraId);

    // 1. Por defecto, buscar estudiantes que están cursando la materia de titulación (Taller III o similar)
    if (!todos) {
      let materiasFiltroIds: number[] = [];
      if (materiaId) {
        materiasFiltroIds = [Number(materiaId)];
      } else {
        const materiasTitulacion = await prisma.materia.findMany({
          where: {
            planEstudio: { carreraId: cid },
            OR: [
              { nombre: { contains: 'taller iii', mode: 'insensitive' } },
              { nombre: { contains: 'taller 3', mode: 'insensitive' } },
              { nombre: { contains: 'trabajo de grado', mode: 'insensitive' } },
              { nombre: { contains: 'titulacion', mode: 'insensitive' } },
              { codigo: { contains: '501', mode: 'insensitive' } },
              { codigo: { contains: '801', mode: 'insensitive' } },
              { codigo: { contains: '901', mode: 'insensitive' } },
            ],
          },
          select: { id: true },
        });
        materiasFiltroIds = materiasTitulacion.map((m) => m.id);
      }

      const whereInscripcion: any = {
        materia: { planEstudio: { carreraId: cid } },
        estado: 'ACTIVA',
      };
      if (materiasFiltroIds.length > 0) {
        whereInscripcion.materiaId = { in: materiasFiltroIds };
      }

      if (busqueda && busqueda.trim()) {
        const term = busqueda.trim();
        whereInscripcion.estudiante = {
          OR: [
            { nombre: { contains: term, mode: 'insensitive' } },
            { apellido: { contains: term, mode: 'insensitive' } },
            { correo: { contains: term, mode: 'insensitive' } },
          ],
        };
      }

      const inscripciones = await prisma.inscripcionMateria.findMany({
        where: whereInscripcion,
        include: {
          estudiante: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              correo: true,
              activo: true,
            },
          },
          materia: {
            select: {
              id: true,
              nombre: true,
              codigo: true,
            },
          },
        },
        orderBy: [
          { estudiante: { apellido: 'asc' } },
          { estudiante: { nombre: 'asc' } },
        ],
      });

      const estudiantesMap = new Map<number, any>();
      for (const insc of inscripciones) {
        if (!insc.estudiante || !insc.estudiante.activo) continue;
        if (!estudiantesMap.has(insc.estudiante.id)) {
          const u = insc.estudiante;
          const ru = u.correo ? u.correo.split('@')[0] : '';
          estudiantesMap.set(u.id, {
            id: u.id,
            nombre: u.nombre,
            apellido: u.apellido || '',
            nombreCompleto: `${u.nombre} ${u.apellido || ''}`.trim(),
            correo: u.correo,
            ru: /^\d+$/.test(ru) ? ru : '',
            ci: '',
            telefono: '',
            materiaInscrita: `${insc.materia.codigo} - ${insc.materia.nombre}`,
            materiaId: insc.materia.id,
            esTallerIII: true,
          });
        }
      }

      const lista = Array.from(estudiantesMap.values());
      if (lista.length > 0 || !busqueda) {
        return lista;
      }
    }

    // 2. Búsqueda excepcional / general en toda la base de datos de estudiantes
    const whereUsuario: any = {
      activo: true,
      OR: [
        { rol: { nombre: { contains: 'Estudiante', mode: 'insensitive' } } },
        { asignacionesRoles: { some: { rol: { nombre: { contains: 'Estudiante', mode: 'insensitive' } } } } },
      ],
    };

    if (busqueda && busqueda.trim()) {
      const term = busqueda.trim();
      whereUsuario.AND = [
        {
          OR: [
            { nombre: { contains: term, mode: 'insensitive' } },
            { apellido: { contains: term, mode: 'insensitive' } },
            { correo: { contains: term, mode: 'insensitive' } },
          ],
        },
      ];
    }

    const estudiantesGeneral = await prisma.usuario.findMany({
      where: whereUsuario,
      select: {
        id: true,
        nombre: true,
        apellido: true,
        correo: true,
      },
      orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
      take: 50,
    });

    return estudiantesGeneral.map((u) => {
      const ru = u.correo ? u.correo.split('@')[0] : '';
      return {
        id: u.id,
        nombre: u.nombre,
        apellido: u.apellido || '',
        nombreCompleto: `${u.nombre} ${u.apellido || ''}`.trim(),
        correo: u.correo,
        ru: /^\d+$/.test(ru) ? ru : '',
        ci: '',
        telefono: '',
        materiaInscrita: 'Búsqueda general de estudiantes',
        esTallerIII: false,
      };
    });
  },

  async obtenerDocentesTribunal(carreraId: number) {
    const cid = Number(carreraId);

    // 1. Docentes que dan clases en esta carrera (por designacionesMaterias o asignacionesRoles)
    let docentesDb = await prisma.usuario.findMany({
      where: {
        activo: true,
        OR: [
          {
            designacionesMaterias: {
              some: {
                activo: true,
                materia: { planEstudio: { carreraId: cid } },
              },
            },
          },
          {
            asignacionesRoles: {
              some: {
                carreraId: cid,
                rol: {
                  nombre: { in: ['Docente', 'Director de Carrera', 'Vicedecano', 'Decano'] },
                },
              },
            },
          },
        ],
      },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        correo: true,
        designacionesMaterias: {
          where: { activo: true },
          select: {
            materia: {
              select: {
                planEstudio: {
                  select: {
                    carrera: { select: { id: true, nombre: true } },
                  },
                },
              },
            },
          },
        },
        asignacionesRoles: {
          select: {
            carreraId: true,
            carrera: { select: { id: true, nombre: true } },
          },
        },
      },
      orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
    });

    // Fallback de contingencia si no hay docentes designados aún en la carrera
    if (docentesDb.length === 0) {
      docentesDb = await prisma.usuario.findMany({
        where: {
          activo: true,
          OR: [
            { rol: { nombre: { in: ['Docente', 'Director de Carrera', 'Vicedecano', 'Decano'] } } },
            { asignacionesRoles: { some: { rol: { nombre: { in: ['Docente', 'Director de Carrera', 'Vicedecano', 'Decano'] } } } } },
          ],
        },
        select: {
          id: true,
          nombre: true,
          apellido: true,
          correo: true,
          designacionesMaterias: {
            where: { activo: true },
            select: {
              materia: {
                select: {
                  planEstudio: {
                    select: {
                      carrera: { select: { id: true, nombre: true } },
                    },
                  },
                },
              },
            },
          },
          asignacionesRoles: {
            select: {
              carreraId: true,
              carrera: { select: { id: true, nombre: true } },
            },
          },
        },
        orderBy: [{ apellido: 'asc' }, { nombre: 'asc' }],
      });
    }

    return docentesDb.map((docente) => {
      const otrasCarrerasSet = new Set<string>();

      docente.designacionesMaterias.forEach((d) => {
        const c = d.materia?.planEstudio?.carrera;
        if (c && c.id !== cid) {
          otrasCarrerasSet.add(c.nombre);
        }
      });

      docente.asignacionesRoles.forEach((a) => {
        if (a.carrera && a.carreraId && a.carreraId !== cid) {
          otrasCarrerasSet.add(a.carrera.nombre);
        }
      });

      const materiasEnOtrasCarreras = Array.from(otrasCarrerasSet);

      return {
        id: docente.id,
        nombre: docente.nombre,
        apellido: docente.apellido || '',
        nombreCompleto: `${docente.nombre} ${docente.apellido || ''}`.trim(),
        correo: docente.correo,
        materiasEnOtrasCarreras,
        tieneMateriasEnOtrasCarreras: materiasEnOtrasCarreras.length > 0,
      };
    });
  },
};

const fechaEmisionTexto = () => {
  const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  return `${dias[new Date().getDay()]} ${formatearFecha(new Date())}`;
};