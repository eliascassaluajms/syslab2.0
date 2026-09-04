import { Prisma } from '@prisma/client';
import { createRequire } from 'node:module';
import { prisma } from '../config/prisma.js';
import { AppError } from '../utils/appError.js';

const require = createRequire(import.meta.url);

export type RolTribunal = 'PRESIDENTE' | 'SECRETARIO' | 'VOCAL';

export type TribunalInput = {
  docenteId: number;
  rol: RolTribunal;
  esExterno?: boolean;
  institucionProcedencia?: string;
};

export type TrabajoGradoCreateInput = {
  titulo: string;
  modalidad: string;
  gradoOptado: string;
  carreraId: number;
  estudianteNombre: string;
  estudianteCi: string;
  estudianteRu: string;
  estudianteEmail: string;
  estudianteTelefono?: string;
};

export const validarAsignacionTribunal = (tribunales: TribunalInput[]) => {
  const errores: string[] = [];
  const roles = new Set<string>();

  if (!Array.isArray(tribunales) || tribunales.length === 0) {
    return { valido: false, errores: ['Debe asignar al menos 3 tribunales.'] };
  }

  for (const tribunal of tribunales) {
    if (!tribunal || !tribunal.rol) {
      errores.push('Cada tribunal requiere un rol válido.');
      continue;
    }

    const rol = tribunal.rol.toUpperCase();
    if (roles.has(rol)) {
      errores.push(`El rol ${rol} no puede repetirse en la misma designación.`);
    }
    roles.add(rol);

    if (!tribunal.docenteId || Number(tribunal.docenteId) <= 0) {
      errores.push(`El tribunal ${rol} requiere un docente válido.`);
    }
  }

  const rolesRequeridos: RolTribunal[] = ['PRESIDENTE', 'SECRETARIO', 'VOCAL'];
  for (const rol of rolesRequeridos) {
    if (!tribunales.some((tribunal) => tribunal.rol?.toUpperCase() === rol)) {
      errores.push(`Falta designar el rol ${rol}.`);
    }
  }

  return { valido: errores.length === 0, errores };
};

export const resumirEstadoTrabajo = (trabajo: {
  estado?: string;
  versionesDocumento?: Array<{ id: string }>;
  observaciones?: Array<{ id: string }>;
  tribunales?: Array<{ rol?: string }>;
}) => {
  return {
    estado: trabajo.estado ?? 'REGISTRADO',
    versiones: trabajo.versionesDocumento?.length ?? 0,
    observaciones: trabajo.observaciones?.length ?? 0,
    tribunales: trabajo.tribunales?.length ?? 0,
  };
};

const buildPdfBuffer = (docDefinition: any) => {
  const pdfmake = require('pdfmake');
  const printer = new pdfmake.PdfPrinter({
    Helvetica: {
      normal: 'Helvetica',
      bold: 'Helvetica-Bold',
      italics: 'Helvetica-Oblique',
      bolditalics: 'Helvetica-BoldOblique',
    },
  });

  return new Promise<Buffer>((resolve, reject) => {
    try {
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const chunks: Buffer[] = [];
      pdfDoc.on('data', (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on('end', () => resolve(Buffer.concat(chunks)));
      pdfDoc.on('error', (err: any) => reject(err));
      pdfDoc.end();
    } catch (error) {
      reject(error);
    }
  });
};

export const defensaService = {
  async listarTrabajos(filtros: { carreraId?: number; estado?: string; gestion?: string } = {}) {
    return prisma.trabajoGrado.findMany({
      where: {
        ...(filtros.carreraId ? { carreraId: Number(filtros.carreraId) } : {}),
        ...(filtros.estado ? { estado: filtros.estado as any } : {}),
      },
      include: {
        carrera: true,
        tribunales: { include: { docente: { select: { id: true, nombre: true, apellido: true, correo: true } } } },
        versionesDocumento: { orderBy: { fechaSubida: 'desc' } },
        observaciones: { orderBy: { creadoEn: 'desc' } },
      },
      orderBy: { creadoEn: 'desc' },
    });
  },

  async crearTrabajo(data: TrabajoGradoCreateInput) {
    const titulo = data.titulo?.trim();
    const estudianteNombre = data.estudianteNombre?.trim();
    if (!titulo || !estudianteNombre || !data.carreraId) {
      throw new AppError('Faltan datos obligatorios para registrar el trabajo de grado.', 400);
    }

    const carrera = await prisma.carrera.findUnique({ where: { id: Number(data.carreraId) } });
    if (!carrera) {
      throw new AppError('La carrera especificada no existe.', 404);
    }

    const trabajo = await prisma.trabajoGrado.create({
      data: {
        titulo,
        modalidad: data.modalidad?.trim() || 'Trabajo Dirigido',
        gradoOptado: data.gradoOptado?.trim() || 'Licenciatura en Ingeniería Informática',
        carreraId: Number(data.carreraId),
        estudianteNombre,
        estudianteCi: data.estudianteCi?.trim() || 'Sin CI',
        estudianteRu: data.estudianteRu?.trim() || 'Sin RU',
        estudianteEmail: data.estudianteEmail?.trim() || 'sin-email@uajms.edu.bo',
        estudianteTelefono: data.estudianteTelefono?.trim() || null,
        estado: 'REGISTRADO',
      },
      include: { carrera: true },
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

  async asignarTribunales(trabajoId: string, tribunales: TribunalInput[]) {
    const validacion = validarAsignacionTribunal(tribunales);
    if (!validacion.valido) {
      throw new AppError(validacion.errores.join(' '), 400);
    }

    const trabajo = await prisma.trabajoGrado.findUnique({ where: { id: trabajoId } });
    if (!trabajo) {
      throw new AppError('El trabajo de grado no existe.', 404);
    }

    const transacciones: Prisma.PrismaPromise<any>[] = [];
    const designaciones = tribunales.map((tribunal) => ({
      trabajoGradoId: trabajoId,
      docenteId: Number(tribunal.docenteId),
      rol: tribunal.rol,
      esExterno: Boolean(tribunal.esExterno),
      institucionProcedencia: tribunal.institucionProcedencia?.trim() || null,
    }));

    for (const item of designaciones) {
      transacciones.push(
        prisma.designacionTribunal.upsert({
          where: {
            trabajoGradoId_rol: { trabajoGradoId: trabajoId, rol: item.rol },
          },
          update: {
            docenteId: item.docenteId,
            esExterno: item.esExterno,
            institucionProcedencia: item.institucionProcedencia,
          },
          create: item,
        })
      );
    }

    await prisma.$transaction(transacciones);

    await prisma.trabajoGrado.update({
      where: { id: trabajoId },
      data: { estado: 'TRIBUNAL_DESIGNADO' },
    });

    return this.obtenerTrabajoPorId(trabajoId);
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

  async registrarObservacion(trabajoId: string, designacionId: string, detalleObservacion: string, archivoCorreccionesUrl?: string) {
    const designacion = await prisma.designacionTribunal.findUnique({ where: { id: designacionId } });
    if (!designacion || designacion.trabajoGradoId !== trabajoId) {
      throw new AppError('La designación de tribunal no pertenece a este trabajo.', 400);
    }

    const siguienteRevision = (await prisma.observacionTribunal.count({
      where: { trabajoGradoId: trabajoId, designacionId },
    })) + 1;

    const observacion = await prisma.observacionTribunal.create({
      data: {
        trabajoGradoId: trabajoId,
        designacionId,
        numeroRevision: siguienteRevision,
        detalleObservacion: detalleObservacion.trim(),
        archivoCorreccionesUrl: archivoCorreccionesUrl?.trim() || null,
      },
    });

    await prisma.trabajoGrado.update({
      where: { id: trabajoId },
      data: { estado: 'CON_OBSERVACIONES' },
    });

    return observacion;
  },

  async emitirConformidad(trabajoId: string, designacionId: string, cartaConformidadUrl: string) {
    const designacion = await prisma.designacionTribunal.findUnique({ where: { id: designacionId } });
    if (!designacion || designacion.trabajoGradoId !== trabajoId) {
      throw new AppError('No es posible emitir la conformidad para esta designación.', 400);
    }

    const conformidad = await prisma.designacionTribunal.update({
      where: { id: designacionId },
      data: {
        estadoRevision: 'CONFORME',
        fechaConformidad: new Date(),
        cartaConformidadUrl: cartaConformidadUrl.trim(),
      },
    });

    const trabajo = await prisma.trabajoGrado.findUnique({
      where: { id: trabajoId },
      include: { tribunales: true },
    });

    if (trabajo && trabajo.tribunales.every((tribunal) => tribunal.estadoRevision === 'CONFORME')) {
      await prisma.trabajoGrado.update({
        where: { id: trabajoId },
        data: { estado: 'APTO_PARA_DEFENSA' },
      });
    }

    return conformidad;
  },

  async generarActa(trabajoId: string) {
    const trabajo = await prisma.trabajoGrado.findUnique({
      where: { id: trabajoId },
      include: {
        tribunales: { include: { docente: true } },
      },
    });

    if (!trabajo) {
      throw new AppError('El trabajo de grado no existe.', 404);
    }

    const conformes = trabajo.tribunales.every((tribunal) => tribunal.estadoRevision === 'CONFORME');
    if (!conformes) {
      throw new AppError('Debe existir la conformidad de los tres tribunales para generar el acta.', 400);
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

    const docDefinition = {
      pageSize: 'LETTER',
      pageMargins: [40, 40, 40, 40],
      content: [
        { text: 'UNIVERSIDAD AUTÓNOMA JUAN MISAEL SARACHO', bold: true, fontSize: 14, alignment: 'center', margin: [0, 0, 0, 10] },
        { text: 'FACULTAD DE CIENCIAS INTEGRADAS DE YACUIBA', fontSize: 11, alignment: 'center', margin: [0, 0, 0, 20] },
        { text: 'MEMORÁNDUM DE DESIGNACIÓN DE TRIBUNAL', bold: true, fontSize: 13, alignment: 'center', margin: [0, 0, 0, 10] },
        { text: `N° ${designacion.numeroMemorandum || 'M-2026-001'}`, fontSize: 10, margin: [0, 0, 0, 15] },
        {
          text: `La Dirección de Carrera de ${trabajo.carrera?.nombre || 'la carrera'} tiene a bien designar a ${designacion.docente?.nombre || 'el docente'} ${designacion.docente?.apellido || ''} como TRIBUNAL EVALUADOR (${designacion.rol}) del Trabajo de Grado titulado “${trabajo.titulo}”, presentado por el/la universitario(a) ${trabajo.estudianteNombre} para optar al grado académico de ${trabajo.gradoOptado}.`,
          fontSize: 11,
          lineHeight: 1.5,
          margin: [0, 0, 0, 20],
        },
        { text: 'Plazo reglamentario: 10 días hábiles para la entrega de observaciones.', fontSize: 10, bold: true, margin: [0, 0, 0, 10] },
        { text: 'Firma y sello del Director de Carrera', alignment: 'right', margin: [0, 80, 0, 0] },
        { text: '_______________________________', alignment: 'right', margin: [0, 20, 0, 0] },
      ],
    };

    return buildPdfBuffer(docDefinition);
  },

  async generarActaPdf(trabajoId: string) {
    const trabajo = await this.obtenerTrabajoPorId(trabajoId);
    const docDefinition = {
      pageSize: 'LETTER',
      pageMargins: [40, 40, 40, 40],
      content: [
        { text: 'ACTA DE DEFENSA PÚBLICA DE GRADO', bold: true, fontSize: 15, alignment: 'center', margin: [0, 0, 0, 15] },
        { text: 'En la ciudad de Yacuiba, a horas ______:______ del día ______ de ____________________ de 20____, en ambientes del ______________________.', fontSize: 11, margin: [0, 0, 0, 12] },
        { text: `Postulante: ${trabajo.estudianteNombre} | C.I.: ${trabajo.estudianteCi} | R.U.: ${trabajo.estudianteRu}`, fontSize: 11, margin: [0, 0, 0, 8] },
        { text: `Título: ${trabajo.titulo}`, fontSize: 11, margin: [0, 0, 0, 8] },
        { text: `Carrera: ${trabajo.carrera?.nombre || 'Sin carrera'} | Grado Académico: ${trabajo.gradoOptado}`, fontSize: 11, margin: [0, 0, 0, 12] },
        { table: { widths: ['*', '*', '*', '*'], body: [[{ text: 'Documento escrito', bold: true }, { text: '[ ___ / 50 pts ]' }, { text: 'Exposición oral', bold: true }, { text: '[ ___ / 25 pts ]' }], [{ text: 'Defensa y preguntas', bold: true }, { text: '[ ___ / 25 pts ]' }, { text: 'Calificación final', bold: true }, { text: '[ ___ / 100 pts ]' }]] }, margin: [0, 0, 0, 14] },
        { text: 'Calificación literal: _____________________________________', fontSize: 11, margin: [0, 0, 0, 12] },
        { text: 'Veredicto: [ ] APROBADO CON DISTINCIÓN  [ ] APROBADO  [ ] POSTERGADO', fontSize: 11, margin: [0, 0, 0, 20] },
        { columns: [
          { width: '*', stack: [{ text: 'PRESIDENTE', bold: true }, { text: '________________________________', margin: [0, 20, 0, 0] }, { text: 'Firma', fontSize: 10, italics: true }] },
          { width: '*', stack: [{ text: 'SECRETARIO', bold: true }, { text: '________________________________', margin: [0, 20, 0, 0] }, { text: 'Firma', fontSize: 10, italics: true }] },
          { width: '*', stack: [{ text: 'VOCAL', bold: true }, { text: '________________________________', margin: [0, 20, 0, 0] }, { text: 'Firma', fontSize: 10, italics: true }] },
        ] },
      ],
    };

    return buildPdfBuffer(docDefinition);
  },
};
