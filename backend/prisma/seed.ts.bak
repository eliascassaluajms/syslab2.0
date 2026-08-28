// backend/prisma/seed.ts
import pkg from 'pg';
const { Pool } = pkg;
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

// Inicialización del Driver Adapter requerido en el entorno Docker
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Hash dinámico y real para la contraseña por defecto 'SysLab2026*'
const DUMMY_PASSWORD_HASH = bcrypt.hashSync('SysLab2026*', 10); 

async function main() {
  console.log('🌱 Iniciando el proceso de Seeding (Datos Maestros SysLab 2.0)...');

  // =========================================================================
  // 2. INYECCIÓN DE PERMISOS MAESTROS (Idempotente con upsert)
  // =========================================================================
  const listaPermisos = [
    { codigo: 'usuarios:crear', descripcion: 'Permite registrar nuevos usuarios' },
    { codigo: 'usuarios:listar', descripcion: 'Permite visualizar la lista de usuarios' },
    { codigo: 'usuarios:editar', descripcion: 'Permite modificar datos de usuarios' },
    { codigo: 'usuarios:eliminar', descripcion: 'Permite dar de baja o eliminar usuarios' },

    { codigo: 'roles:crear', descripcion: 'Permite crear nuevos roles de acceso' },
    { codigo: 'roles:listar', descripcion: 'Permite listar los roles existentes' },
    { codigo: 'roles:editar', descripcion: 'Permite modificar descripciones y permisos de roles' },
    { codigo: 'roles:eliminar', descripcion: 'Permite eliminar roles del sistema' },

    { codigo: 'laboratorios:crear', descripcion: 'Permite registrar nuevos laboratorios físicos' },
    { codigo: 'laboratorios:listar', descripcion: 'Permite listar laboratorios disponibles' },
    { codigo: 'laboratorios:editar', descripcion: 'Permite editar la infraestructura de laboratorios' },
    { codigo: 'laboratorios:eliminar', descripcion: 'Permite eliminar registros de laboratorios' },
    { codigo: 'laboratorios:ver_estado', descripcion: 'Permite ver el estado operativo actual de los laboratorios en tiempo real' },

    { codigo: 'equipos:crear', descripcion: 'Permite registrar equipos individuales o en lote' },
    { codigo: 'equipos:listar', descripcion: 'Permite listar el inventario de equipos' },
    { codigo: 'equipos:editar', descripcion: 'Permite modificar detalles o estado de equipos' },
    { codigo: 'equipos:eliminar', descripcion: 'Permite dar de baja equipos del inventario' },

    { codigo: 'materias:crear', descripcion: 'Permite registrar asignaturas curriculares' },
    { codigo: 'materias:listar', descripcion: 'Permite listar las materias del plan de estudios' },
    { codigo: 'materias:editar', descripcion: 'Permite modificar datos de las materias' },
    { codigo: 'materias:eliminar', descripcion: 'Permite eliminar materias' },

    { codigo: 'horarios:crear', descripcion: 'Permite asignar franjas horarias a laboratorios' },
    { codigo: 'horarios:listar', descripcion: 'Permite ver el cronograma de horarios' },
    { codigo: 'horarios:editar', descripcion: 'Permite reestructurar asignaciones de tiempo' },
    { codigo: 'horarios:eliminar', descripcion: 'Permite remover horarios asignados' },

    { codigo: 'facultades:crear', descripcion: 'Permite registrar nuevas facultades institucionales' },
    { codigo: 'facultades:listar', descripcion: 'Permite listar las facultades' },
    { codigo: 'facultades:editar', descripcion: 'Permite modificar datos institucionales de facultades' },
    { codigo: 'facultades:eliminar', descripcion: 'Permite dar de baja facultades' },

    { codigo: 'carreras:crear', descripcion: 'Permite añadir planes de carrera universitarios' },
    { codigo: 'carreras:listar', descripcion: 'Permite listar las carreras del sistema' },
    { codigo: 'carreras:editar', descripcion: 'Permite editar información de carreras' },
    { codigo: 'carreras:eliminar', descripcion: 'Permite eliminar carreras' },

    { codigo: 'fallas:crear', descripcion: 'Permite registrar incidencias o fallas' },
    { codigo: 'fallas:listar', descripcion: 'Permite ver el listado de fallas reportadas' },
    { codigo: 'fallas:editar', descripcion: 'Permite actualizar el estado de una falla' },
    { codigo: 'fallas:eliminar', descripcion: 'Permite remover reportes de fallas' },
    { codigo: 'fallas:ver_reportes', descripcion: 'Permite visualizar reportes globales y analíticas de fallas' },

    { codigo: 'uso_laboratorios:crear', descripcion: 'Permite abrir bitácoras de uso de laboratorios' },
    { codigo: 'uso_laboratorios:listar', descripcion: 'Permite listar el histórico de ocupación' },
    { codigo: 'uso_laboratorios:editar', descripcion: 'Permite modificar registros de uso' },
    { codigo: 'uso_laboratorios:eliminar', descripcion: 'Permite eliminar registros de bitácora' },

    { codigo: 'planes_estudio:crear', descripcion: 'Permite registrar nuevos planes de estudio' },
    { codigo: 'planes_estudio:listar', descripcion: 'Permite listar los planes de estudio de una carrera' },
    { codigo: 'planes_estudio:editar', descripcion: 'Permite modificar datos de los planes de estudio' },
    { codigo: 'planes_estudio:eliminar', descripcion: 'Permite eliminar planes de estudio' },

    // --- MÓDULO DE ACTIVIDADES ACADÉMICAS ---
    { codigo: 'actividades:categorias_listar', descripcion: 'Permite ver y consultar las categorías de actividades académicas' },
    { codigo: 'actividades:categorias_crear', descripcion: 'Permite crear nuevas categorías de actividades académicas' },
    { codigo: 'actividades:categorias_editar', descripcion: 'Permite modificar categorías de actividades académicas' },
    { codigo: 'actividades:categorias_eliminar', descripcion: 'Permite eliminar categorías de actividades académicas' },

    { codigo: 'actividades:listar', descripcion: 'Permite listar las actividades académicas programadas' },
    { codigo: 'actividades:crear', descripcion: 'Permite registrar y organizar actividades académicas' },
    { codigo: 'actividades:editar', descripcion: 'Permite modificar datos de actividades académicas' },
    { codigo: 'actividades:eliminar', descripcion: 'Permite dar de baja o cancelar actividades académicas' },

    { codigo: 'actividades:participantes_listar', descripcion: 'Permite consultar la lista de participantes inscritos' },
    { codigo: 'actividades:participantes_registrar', descripcion: 'Permite registrar la inscripción de participantes' },

    { codigo: 'actividades:pagos_registrar', descripcion: 'Permite registrar el comprobante o pago de inscripción' },
    { codigo: 'actividades:pagos_validar', descripcion: 'Permite validar, aprobar o rechazar pagos de inscripción' }
  ];

  const permisosCreados = [];
  for (const p of listaPermisos) {
    const permiso = await prisma.permiso.upsert({
      where: { codigo: p.codigo },
      update: { descripcion: p.descripcion },
      create: p,
    });
    permisosCreados.push(permiso);
  }
  console.log(`✅ ${permisosCreados.length} Permisos maestros procesados.`);
 // =========================================================================
  // 3. CREACIÓN DE ROLES BASE (Estructura correcta de upsert con create)
  // =========================================================================
  const rolAdmin = await prisma.rol.upsert({
    where: { nombre: 'Administrador' },
    update: {},
    create: { nombre: 'Administrador', descripcion: 'Acceso total global' }
  });

  const rolRector = await prisma.rol.upsert({
    where: { nombre: 'Rector' },
    update: {},
    create: { nombre: 'Rector', descripcion: 'Máxima autoridad universitaria con supervisión global' }
  });

  const rolVicerrector = await prisma.rol.upsert({
    where: { nombre: 'Vicerrector' },
    update: {},
    create: { nombre: 'Vicerrector', descripcion: 'Autoridad académica central y supervisión de eventos' }
  });

  const rolDecano = await prisma.rol.upsert({
    where: { nombre: 'Decano' },
    update: {},
    create: { nombre: 'Decano', descripcion: 'Máxima autoridad facultativa y supervisión perimetral' }
  });

  const rolVicedecano = await prisma.rol.upsert({
    where: { nombre: 'Vicedecano' },
    update: {},
    create: { nombre: 'Vicedecano', descripcion: 'Autoridad académica facultativa y gestión perimetral' }
  });

  const rolDirectorCarrera = await prisma.rol.upsert({
    where: { nombre: 'Director de Carrera' },
    update: {},
    create: { nombre: 'Director de Carrera', descripcion: 'Gestión académica y supervisión a nivel de carrera' }
  });

  const rolJefe = await prisma.rol.upsert({
    where: { nombre: 'Jefe de Laboratorios' },
    update: {},
    create: { nombre: 'Jefe de Laboratorios', descripcion: 'Gestión operativa perimetralizada' }
  });

  const rolTecnico = await prisma.rol.upsert({
    where: { nombre: 'Técnico' },
    update: {},
    create: { nombre: 'Técnico', descripcion: 'Soporte e incidencias' }
  });

  const rolDocente = await prisma.rol.upsert({
    where: { nombre: 'Docente' },
    update: {},
    create: { nombre: 'Docente', descripcion: 'Reserva y uso de ambientes' }
  });

  const rolOperadorEventos = await prisma.rol.upsert({
    where: { nombre: 'Operador de Eventos' },
    update: {},
    create: { nombre: 'Operador de Eventos', descripcion: 'Gestión, logística y control de actividades académicas' }
  });

  const rolUnadef = await prisma.rol.upsert({
    where: { nombre: 'UNADEF' },
    update: {},
    create: { nombre: 'UNADEF', descripcion: 'Validación y fiscalización financiera de pagos de inscripción' }
  });

  const rolUnada = await prisma.rol.upsert({
    where: { nombre: 'UNADA' },
    update: {},
    create: { nombre: 'UNADA', descripcion: 'Control, verificación y admisión académica' }
  });

  const rolParticipante = await prisma.rol.upsert({
    where: { nombre: 'Participante de Eventos' },
    update: {},
    create: { nombre: 'Participante de Eventos', descripcion: 'Inscripción y participación en actividades académicas' }
  });

  const rolEstudiante = await prisma.rol.upsert({
    where: { nombre: 'Estudiante' },
    update: {},
    create: { nombre: 'Estudiante', descripcion: 'Acceso básico, consulta de horarios y eventos' }
  });

  console.log('✅ Roles base procesados con éxito.');

// =========================================================================
  // 4. ASIGNACIÓN MATRIZ: ROL - PERMISO
  // =========================================================================

  // 1. El rol Administrador recibe TODOS los permisos maestros
  for (const p of permisosCreados) {
    await prisma.rolPermiso.upsert({
      where: { rolId_permisoId: { rolId: rolAdmin.id, permisoId: p.id } },
      update: {},
      create: { rolId: rolAdmin.id, permisoId: p.id }
    });
  }

  // 2. Definición de matriz de permisos por rol
  const asignacionesPermisos = [
    {
      rolId: rolRector.id,
      codigos: [
        'facultades:listar', 'carreras:listar', 'laboratorios:listar', 'laboratorios:ver_estado',
        'fallas:ver_reportes', 'actividades:listar', 'actividades:participantes_listar'
      ]
    },
    {
      rolId: rolVicerrector.id,
      codigos: [
        'facultades:listar', 'carreras:listar', 'laboratorios:listar', 'laboratorios:ver_estado',
        'fallas:ver_reportes', 'actividades:listar', 'actividades:participantes_listar'
      ]
    },
    {
      rolId: rolDecano.id,
      codigos: [
        'carreras:listar', 'laboratorios:listar', 'laboratorios:ver_estado',
        'fallas:ver_reportes', 'actividades:listar', 'actividades:participantes_listar'
      ]
    },
    {
      rolId: rolVicedecano.id,
      codigos: [
        'carreras:listar', 'laboratorios:listar', 'laboratorios:ver_estado',
        'fallas:ver_reportes', 'actividades:listar', 'actividades:participantes_listar'
      ]
    },
    {
      rolId: rolDirectorCarrera.id,
      codigos: [
        'materias:listar', 'materias:editar', 'planes_estudio:listar', 'horarios:listar',
        'laboratorios:listar', 'laboratorios:ver_estado', 'fallas:crear', 'fallas:listar',
        'actividades:listar', 'actividades:crear', 'actividades:editar', 'actividades:participantes_listar'
      ]
    },
    {
      rolId: rolJefe.id,
      codigos: [
        'laboratorios:crear', 'laboratorios:listar', 'laboratorios:editar', 'laboratorios:ver_estado',
        'equipos:crear', 'equipos:listar', 'equipos:editar', 'equipos:eliminar',
        'materias:crear', 'materias:listar', 'materias:editar',
        'horarios:crear', 'horarios:listar', 'horarios:editar',
        'fallas:crear', 'fallas:listar', 'fallas:editar', 'fallas:ver_reportes',
        'uso_laboratorios:crear', 'uso_laboratorios:listar', 'uso_laboratorios:editar', 
        'planes_estudio:crear', 'planes_estudio:listar', 'planes_estudio:editar', 'planes_estudio:eliminar',
        'actividades:listar', 'actividades:crear', 'actividades:editar', 'actividades:participantes_listar'
      ]
    },
    {
      rolId: rolTecnico.id,
      codigos: [
        'laboratorios:listar', 'laboratorios:ver_estado', 'equipos:listar', 'equipos:editar',
        'fallas:crear', 'fallas:listar', 'fallas:editar', 'uso_laboratorios:listar'
      ]
    },
    {
      rolId: rolDocente.id,
      codigos: [
        'laboratorios:listar', 'laboratorios:ver_estado', 'equipos:listar', 'horarios:listar',
        'fallas:crear', 'fallas:listar', 'uso_laboratorios:crear', 'uso_laboratorios:listar',
        'actividades:listar', 'actividades:participantes_registrar'
      ]
    },
    {
      rolId: rolOperadorEventos.id,
      codigos: [
        'actividades:categorias_listar', 'actividades:categorias_crear', 'actividades:categorias_editar', 'actividades:categorias_eliminar',
        'actividades:listar', 'actividades:crear', 'actividades:editar', 'actividades:eliminar',
        'actividades:participantes_listar', 'actividades:participantes_registrar', 'actividades:pagos_registrar'
      ]
    },
    {
      rolId: rolUnadef.id,
      codigos: [
        'actividades:listar', 'actividades:participantes_listar',
        'actividades:pagos_registrar', 'actividades:pagos_validar'
      ]
    },
    {
      rolId: rolUnada.id,
      codigos: [
        'actividades:listar', 'actividades:participantes_listar', 'actividades:participantes_registrar'
      ]
    },
    {
      rolId: rolParticipante.id,
      codigos: [
        'actividades:listar', 'actividades:participantes_registrar', 'actividades:pagos_registrar'
      ]
    },
    {
      rolId: rolEstudiante.id,
      codigos: [
        'laboratorios:listar', 'laboratorios:ver_estado', 'horarios:listar',
        'actividades:listar', 'actividades:participantes_registrar', 'actividades:pagos_registrar'
      ]
    }
  ];

  // 3. Ejecución de la vinculación idempotente
  for (const asignacion of asignacionesPermisos) {
    for (const p of permisosCreados) {
      if (asignacion.codigos.includes(p.codigo)) {
        await prisma.rolPermiso.upsert({
          where: { rolId_permisoId: { rolId: asignacion.rolId, permisoId: p.id } },
          update: {},
          create: { rolId: asignacion.rolId, permisoId: p.id }
        });
      }
    }
  }

  console.log('✅ Matriz de permisos vinculada exitosamente a todos los roles.');

  // =========================================================================
  // 5. ESTRUCTURA INSTITUCIONAL (Facultades, Carreras y 7 Laboratorios)
  // =========================================================================
  const facNaturales = await prisma.facultad.upsert({
    where: { sigla: 'FCIRNT' },
    update: {},
    create: { nombre: 'Facultad de Ciencias de la Ingeniería de Recursos Naturales y Tecnologías', sigla: 'FCIRNT' }
  });

  const carrerasNaturales = [
    'Ingeniería Agronómica',
    'Ingeniería Informática',
    'Ingeniería Sanitaria y Ambiental',
    'Ingeniería de Recursos Hídricos'
  ];

  let carreraInfoId = null;
  for (const nombreCarrera of carrerasNaturales) {
    const carrera = await prisma.carrera.upsert({
      where: { nombre: nombreCarrera },
      update: { facultadId: facNaturales.id },
      create: { nombre: nombreCarrera, facultadId: facNaturales.id }
    });
    if (nombreCarrera === 'Ingeniería Informática') {
      carreraInfoId = carrera.id;
    }
  }

  const facEmpresariales = await prisma.facultad.upsert({
    where: { sigla: 'FCE' },
    update: {},
    create: { nombre: 'Facultad de Ciencias Empresariales', sigla: 'FCE' }
  });

  const carrerasEmpresariales = [
    'Ingeniería Comercial',
    'Administración y Gestión Pública',
    'Contaduría Pública'
  ];

  for (const nombreCarrera of carrerasEmpresariales) {
    await prisma.carrera.upsert({
      where: { nombre: nombreCarrera },
      update: { facultadId: facEmpresariales.id },
      create: { nombre: nombreCarrera, facultadId: facEmpresariales.id }
    });
  }

  const carreraAmbientalId = (await prisma.carrera.findFirst({ where: { nombre: 'Ingeniería Sanitaria y Ambiental' } }))?.id || carreraInfoId;

  // Inyección de los 7 laboratorios con upsert correcto
  const lab1 = await prisma.laboratorio.upsert({
    where: { codigo: 'LAB-1' },
    update: {},
    create: {
      codigo: 'LAB-1',
      nombre: 'Laboratorio 1 Ing Agronómica / Computación',
      ubicacion: 'Calle Jacinto Delfín, Campus Yacuiba',
      capacidad: 25,
      facultadId: facNaturales.id,
      carreraId: carreraInfoId
    }
  });

  const lab2 = await prisma.laboratorio.upsert({
    where: { codigo: 'LAB-2' },
    update: {},
    create: {
      codigo: 'LAB-2',
      nombre: 'Laboratorio 2 de Informática',
      ubicacion: 'Campus Universitario Yacuiba',
      capacidad: 20,
      facultadId: facNaturales.id,
      carreraId: carreraInfoId
    }
  });

  const lab3 = await prisma.laboratorio.upsert({
    where: { codigo: 'LAB-3' },
    update: {},
    create: {
      codigo: 'LAB-3',
      nombre: 'Laboratorio 3 de Informática',
      ubicacion: 'Campus Universitario Yacuiba',
      capacidad: 20,
      facultadId: facNaturales.id,
      carreraId: carreraInfoId
    }
  });

  const lab4 = await prisma.laboratorio.upsert({
    where: { codigo: 'LAB-4' },
    update: {},
    create: {
      codigo: 'LAB-4',
      nombre: 'Laboratorio 4 de Informática',
      ubicacion: 'Campus Universitario Yacuiba',
      capacidad: 20,
      facultadId: facNaturales.id,
      carreraId: carreraInfoId
    }
  });

  const lab5 = await prisma.laboratorio.upsert({
    where: { codigo: 'LAB-5' },
    update: {},
    create: {
      codigo: 'LAB-5',
      nombre: 'Laboratorio de Sanitaria y Ambiental',
      ubicacion: 'Campus Universitario Yacuiba',
      capacidad: 20,
      facultadId: facNaturales.id,
      carreraId: carreraAmbientalId
    }
  });

  const lab6 = await prisma.laboratorio.upsert({
    where: { codigo: 'LAB-6' },
    update: {},
    create: {
      codigo: 'LAB-6',
      nombre: 'Laboratorio / Oficinas Centrales',
      ubicacion: 'Campus Universitario Yacuiba',
      capacidad: 15,
      facultadId: facNaturales.id,
      carreraId: carreraInfoId
    }
  });

  const lab7 = await prisma.laboratorio.upsert({
    where: { codigo: 'LAB-7' },
    update: {},
    create: {
      codigo: 'LAB-7',
      nombre: 'Laboratorio Sede Caraparí',
      ubicacion: 'Sede Desconcentrada Caraparí',
      capacidad: 25,
      facultadId: facNaturales.id,
      carreraId: carreraInfoId
    }
  });

  console.log('✅ Facultades, Carreras y los 7 Laboratorios institucionales cargados.');

  // =========================================================================
  // 5.1. PLAN DE ESTUDIOS 2007 - INGENIERÍA INFORMÁTICA
  // =========================================================================
  let planInformatica2007 = await prisma.planEstudio.findFirst({
    where: { 
      carreraId: carreraInfoId, 
      gestion: 2007 
    }
  });

  if (!planInformatica2007) {
    planInformatica2007 = await prisma.planEstudio.create({
      data: {
        carreraId: carreraInfoId,
        gestion: 2007,
        descripcion: 'Plan de Estudios 2007 - Ingeniería Informática'
      }
    });
  } else {
    planInformatica2007 = await prisma.planEstudio.update({
      where: { id: planInformatica2007.id },
      data: { descripcion: 'Plan de Estudios 2007 - Ingeniería Informática' }
    });
  }

  const materiasPlan2007 = [
    { codigo: 'MAT111', nombre: 'CALCULO I', semestre: 1, tipoPeriodo: 'Semestral' },
    { codigo: 'MAT112', nombre: 'ALGEBRA LINEAL', semestre: 1, tipoPeriodo: 'Semestral' },
    { codigo: 'INF111', nombre: 'PROGRAMACION I', semestre: 1, tipoPeriodo: 'Semestral' },
    { codigo: 'INF112', nombre: 'FUND. DE LA INFORMATICA', semestre: 1, tipoPeriodo: 'Semestral' },
    { codigo: 'LIN111', nombre: 'INGLES I', semestre: 1, tipoPeriodo: 'Semestral' },
    { codigo: 'AUD111', nombre: 'SISTEMAS CONTABLES', semestre: 1, tipoPeriodo: 'Semestral' },
    { codigo: 'MAT121', nombre: 'CALCULO II', semestre: 2, tipoPeriodo: 'Semestral' },
    { codigo: 'FIS111', nombre: 'FISICA I', semestre: 2, tipoPeriodo: 'Semestral' },
    { codigo: 'INF121', nombre: 'PROGRAMACION II', semestre: 2, tipoPeriodo: 'Semestral' },
    { codigo: 'INF122', nombre: 'INTROD. A LOS SISTEMAS OPERATIVOS', semestre: 2, tipoPeriodo: 'Semestral' },
    { codigo: 'MAT122', nombre: 'ESTADISTICA DESCRIPTIVA', semestre: 2, tipoPeriodo: 'Semestral' },
    { codigo: 'LIN121', nombre: 'INGLES II', semestre: 2, tipoPeriodo: 'Semestral' },
    { codigo: 'MAT211', nombre: 'CALCULO III', semestre: 3, tipoPeriodo: 'Semestral' },
    { codigo: 'FIS211', nombre: 'FISICA II', semestre: 3, tipoPeriodo: 'Semestral' },
    { codigo: 'INF211', nombre: 'PROGRAMACION III', semestre: 3, tipoPeriodo: 'Semestral' },
    { codigo: 'INF212', nombre: 'TEORIA DE AUTOMATAS Y LENGUAJES FORMALES', semestre: 3, tipoPeriodo: 'Semestral' },
    { codigo: 'MAT212', nombre: 'TEORIA DE PROBABILIDADES', semestre: 3, tipoPeriodo: 'Semestral' },
    { codigo: 'MAT213', nombre: 'COMBINATORIA Y TEORIA DE GRAFOS', semestre: 3, tipoPeriodo: 'Semestral' },
    { codigo: 'ELT121', nombre: 'LIDERAZGO EMPRESARIAL', semestre: 3, tipoPeriodo: 'Semestral' },
    { codigo: 'MAT221', nombre: 'CALCULO IV', semestre: 4, tipoPeriodo: 'Semestral' },
    { codigo: 'IEL221', nombre: 'TEORIA DE LA COMUNICACION Y SEÑALES', semestre: 4, tipoPeriodo: 'Semestral' },
    { codigo: 'MAT222', nombre: 'ANALISIS NUMERICO', semestre: 4, tipoPeriodo: 'Semestral' },
    { codigo: 'ADM221', nombre: 'ADMINISTRACION DE LAS ORGANIZACIONES', semestre: 4, tipoPeriodo: 'Semestral' },
    { codigo: 'IEL222', nombre: 'ARQUITECTURA DE COMPUTADORES', semestre: 4, tipoPeriodo: 'Semestral' },
    { codigo: 'INF221', nombre: 'PROGRAMACION IV', semestre: 4, tipoPeriodo: 'Semestral' },
    { codigo: 'ELT122', nombre: 'METODOLOGIA DE LA INVESTIGACION', semestre: 4, tipoPeriodo: 'Semestral' },
    { codigo: 'INF311', nombre: 'BASE DE DATOS I', semestre: 5, tipoPeriodo: 'Semestral' },
    { codigo: 'INF312', nombre: 'ANALISIS DE SISTEMAS I', semestre: 5, tipoPeriodo: 'Semestral' },
    { codigo: 'MAT311', nombre: 'INVESTIGACION OPERATIVA I', semestre: 5, tipoPeriodo: 'Semestral' },
    { codigo: 'IEL311', nombre: 'REDES I', semestre: 5, tipoPeriodo: 'Semestral' },
    { codigo: 'ECO311', nombre: 'ECONOMIA GENERAL', semestre: 5, tipoPeriodo: 'Semestral' },
    { codigo: 'INF301', nombre: 'TALLER I', semestre: 5, tipoPeriodo: 'Anual' },
    { codigo: 'ECO321', nombre: 'PREPARACION Y EVALUAC. DE PROYECTOS', semestre: 6, tipoPeriodo: 'Semestral' },
    { codigo: 'IEL321', nombre: 'REDES II', semestre: 6, tipoPeriodo: 'Semestral' },
    { codigo: 'INF321', nombre: 'BASE DE DATOS II', semestre: 6, tipoPeriodo: 'Semestral' },
    { codigo: 'INF322', nombre: 'ANALISIS DE SISTEMAS II', semestre: 6, tipoPeriodo: 'Semestral' },
    { codigo: 'MAT322', nombre: 'INVESTIGACION OPERATIVA II', semestre: 6, tipoPeriodo: 'Semestral' },
    { codigo: 'IEL411', nombre: 'REDES III', semestre: 7, tipoPeriodo: 'Semestral' },
    { codigo: 'INF411', nombre: 'BASES DE DATOS III', semestre: 7, tipoPeriodo: 'Semestral' },
    { codigo: 'INF412', nombre: 'INGENIERIA DE SOFTWARE I', semestre: 7, tipoPeriodo: 'Semestral' },
    { codigo: 'INF413', nombre: 'TECNOLOGIA MULTIMEDIA', semestre: 7, tipoPeriodo: 'Semestral' },
    { codigo: 'INF401', nombre: 'TALLER II', semestre: 7, tipoPeriodo: 'Anual' },
    { codigo: 'INF414', nombre: 'OPTATIVA I', semestre: 7, tipoPeriodo: 'Semestral' },
    { codigo: 'TEL410', nombre: 'LABORATORIO DE GESTION DE REDES', semestre: 7, tipoPeriodo: 'Semestral' },
    { codigo: 'WEM410', nombre: 'DESARROLLO WEB Y MULTIMEDIA', semestre: 7, tipoPeriodo: 'Semestral' },
    { codigo: 'INF421', nombre: 'INTELIGENCIA ARTIFICIAL', semestre: 8, tipoPeriodo: 'Semestral' },
    { codigo: 'INF422', nombre: 'INGENIERIA DE SOFTWARE II', semestre: 8, tipoPeriodo: 'Semestral' },
    { codigo: 'INF423', nombre: 'TECNOLOGIA DE PROGRAMACION EN RED', semestre: 8, tipoPeriodo: 'Semestral' },
    { codigo: 'IEL421', nombre: 'LABORATORIO DE SEGURIDAD EN REDES', semestre: 8, tipoPeriodo: 'Semestral' },
    { codigo: 'INF424', nombre: 'OPTATIVA II', semestre: 8, tipoPeriodo: 'Semestral' },
    { codigo: 'TEL420', nombre: 'SISTEMAS PARALELOS', semestre: 8, tipoPeriodo: 'Semestral' },
    { codigo: 'WEM420', nombre: 'PLANEACION ESTRATEGICA Y DISEÑO DE SITIOS WEB', semestre: 8, tipoPeriodo: 'Semestral' },
    { codigo: 'INF511', nombre: 'ROBOTICA', semestre: 9, tipoPeriodo: 'Semestral' },
    { codigo: 'IEL511', nombre: 'TRANSMISION DE VOZ Y VIDEO', semestre: 9, tipoPeriodo: 'Semestral' },
    { codigo: 'DER511', nombre: 'LEGISLACION', semestre: 9, tipoPeriodo: 'Semestral' },
    { codigo: 'INF501', nombre: 'TALLER III', semestre: 9, tipoPeriodo: 'Anual' },
    { codigo: 'OPT510', nombre: 'OPTATIVA III', semestre: 9, tipoPeriodo: 'Semestral' },
    { codigo: 'WEN510', nombre: 'HERRAMIENTAS DE DISEÑO GRAFICO', semestre: 9, tipoPeriodo: 'Semestral' },
    { codigo: 'TEL510', nombre: 'LABORATORIO DE REDES INALAMBRICAS', semestre: 9, tipoPeriodo: 'Semestral' },
    { codigo: 'INF521', nombre: 'AUDITORIA INFORMATICA', semestre: 10, tipoPeriodo: 'Semestral' },
    { codigo: 'OPT520', nombre: 'OPTATIVA IV', semestre: 10, tipoPeriodo: 'Semestral' },
    { codigo: 'TEL520', nombre: 'TECNOLOGIAS MOVILES', semestre: 10, tipoPeriodo: 'Semestral' },
    { codigo: 'WEM520', nombre: 'COMERCIO ELECTRONICO', semestre: 10, tipoPeriodo: 'Semestral' }
  ];

  for (const mat of materiasPlan2007) {
    await prisma.materia.upsert({
      where: { codigo: mat.codigo },
      update: { planId: planInformatica2007.id },
      create: {
        codigo: mat.codigo,
        nombre: mat.nombre,
        semestre: mat.semestre,
        tipoPeriodo: mat.tipoPeriodo,
        planId: planInformatica2007.id
      }
    });
  }

  // =========================================================================
  // 5.2. NUEVA MALLA CURRICULAR - INGENIERÍA INFORMÁTICA
  // =========================================================================
  let planInformaticaNuevaMalla = await prisma.planEstudio.findFirst({
    where: { 
      carreraId: carreraInfoId, 
      gestion: 2024 
    }
  });

  if (!planInformaticaNuevaMalla) {
    planInformaticaNuevaMalla = await prisma.planEstudio.create({
      data: {
        carreraId: carreraInfoId,
        gestion: 2024,
        descripcion: 'Malla Curricular Nueva - Ingeniería Informática'
      }
    });
  } else {
    planInformaticaNuevaMalla = await prisma.planEstudio.update({
      where: { id: planInformaticaNuevaMalla.id },
      data: { descripcion: 'Malla Curricular Nueva - Ingeniería Informática' }
    });
  }

  const materiasNuevaMalla = [
    { codigo: 'NINF-101', nombre: 'Programación I', semestre: 1 },
    { codigo: 'NINF-102', nombre: 'Algebra', semestre: 1 },
    { codigo: 'NINF-103', nombre: 'Arquitectura de Computadores I', semestre: 1 },
    { codigo: 'NINF-104', nombre: 'Física I', semestre: 1 },
    { codigo: 'NINF-105', nombre: 'Calculo I', semestre: 1 },
    { codigo: 'NINF-106', nombre: 'Probabilidad y Estadísticas', semestre: 1 },
    { codigo: 'NINF-201', nombre: 'Programación II', semestre: 2 },
    { codigo: 'NINF-202', nombre: 'Arquitectura de Computadores II', semestre: 2 },
    { codigo: 'NINF-203', nombre: 'Administración de Sistemas Operativos', semestre: 2 },
    { codigo: 'NINF-204', nombre: 'Física II', semestre: 2 },
    { codigo: 'NINF-205', nombre: 'Calculo II', semestre: 2 },
    { codigo: 'NINF-206', nombre: 'Metodología de Investigación en Informática Aplicada', semestre: 2 },
    { codigo: 'NINF-301', nombre: 'Programación III', semestre: 3 },
    { codigo: 'NINF-302', nombre: 'Teoría de Autómatas y Lenguajes Formales', semestre: 3 },
    { codigo: 'NINF-303', nombre: 'Modelación Y Simulación en Ingeniería Informática', semestre: 3 },
    { codigo: 'NINF-304', nombre: 'Estructuras de Datos Complejas', semestre: 3 },
    { codigo: 'NINF-305', nombre: 'Calculo III', semestre: 3 },
    { codigo: 'NINF-306', nombre: 'Fundamentos de los Sistemas de Información Geográfica', semestre: 3 },
    { codigo: 'NINF-401', nombre: 'Programación IV', semestre: 4 },
    { codigo: 'NINF-402', nombre: 'Redes I', semestre: 4 },
    { codigo: 'NINF-403', nombre: 'Base de Datos I', semestre: 4 },
    { codigo: 'NINF-404', nombre: 'Análisis de Sistemas I', semestre: 4 },
    { codigo: 'NINF-405', nombre: 'Análisis Numérico', semestre: 4 },
    { codigo: 'NINF-406', nombre: 'Internet De Las Cosas', semestre: 4 },
    { codigo: 'NINF-501', nombre: 'Taller I', semestre: 5 },
    { codigo: 'NINF-502', nombre: 'Redes II', semestre: 5 },
    { codigo: 'NINF-503', nombre: 'Base de Datos II', semestre: 5 },
    { codigo: 'NINF-504', nombre: 'Análisis de Sistemas II', semestre: 5 },
    { codigo: 'NINF-505', nombre: 'Robótica', semestre: 5 },
    { codigo: 'NINF-506', nombre: 'Optativa I', semestre: 5 },
    { codigo: 'NINF-601', nombre: 'Taller II', semestre: 6 },
    { codigo: 'NINF-602', nombre: 'Redes III', semestre: 6 },
    { codigo: 'NINF-603', nombre: 'Base de Datos III', semestre: 6 },
    { codigo: 'NINF-604', nombre: 'Ingeniería de Software I', semestre: 6 },
    { codigo: 'NINF-605', nombre: 'Preparación y Evaluación de Proyectos', semestre: 6 },
    { codigo: 'NINF-606', nombre: 'Optativa II', semestre: 6 },
    { codigo: 'NINF-701', nombre: 'Minería de Datos', semestre: 7 },
    { codigo: 'NINF-702', nombre: 'Tecnologías Emergentes I', semestre: 7 },
    { codigo: 'NINF-703', nombre: 'Programación Grafica', semestre: 7 },
    { codigo: 'NINF-704', nombre: 'Ingeniería de Software II', semestre: 7 },
    { codigo: 'NINF-705', nombre: 'Electiva I', semestre: 7 },
    { codigo: 'NINF-706', nombre: 'Optativa III', semestre: 7 },
    { codigo: 'NINF-801', nombre: 'Trabajo de Grado I', semestre: 8 },
    { codigo: 'NINF-802', nombre: 'Tecnologías Emergentes II', semestre: 8 },
    { codigo: 'NINF-803', nombre: 'Inteligencia Artificial', semestre: 8 },
    { codigo: 'NINF-804', nombre: 'Auditoria Informática', semestre: 8 },
    { codigo: 'NINF-805', nombre: 'Electiva II', semestre: 8 },
    { codigo: 'NINF-806', nombre: 'Optativa IV', semestre: 8 },
    { codigo: 'NINF-901', nombre: 'Trabajo de Grado II', semestre: 9 }
  ];

  for (const mat of materiasNuevaMalla) {
    await prisma.materia.upsert({
      where: { codigo: mat.codigo },
      update: { planId: planInformaticaNuevaMalla.id },
      create: {
        codigo: mat.codigo,
        nombre: mat.nombre,
        semestre: mat.semestre,
        tipoPeriodo: 'Semestral',
        planId: planInformaticaNuevaMalla.id
      }
    });
  }

  console.log(`✅ Ambos planes de estudios de Ingeniería Informática inyectados correctamente.`);

  // =========================================================================
  // 6. INVENTARIO DE EQUIPOS EN LABORATORIOS
  // =========================================================================
  for (let i = 1; i <= 20; i++) {
    const numPadded = String(i).padStart(2, '0');
    const codigoInv = `PC-LAB1-${numPadded}`;
    await prisma.equipo.upsert({
      where: { codigoInventario: codigoInv },
      update: {},
      create: {
        codigoInventario: codigoInv,
        nombre: 'Estación de Trabajo OptiPlex',
        marca: 'Dell',
        modelo: 'OptiPlex 7010',
        laboratorioId: lab1.id,
        estado: 'OPERATIVO',
        especificaciones: { procesador: 'Intel Core i7', ram: '16GB', almacenamiento: 'SSD 512GB' }
      }
    });
  }

  for (let i = 1; i <= 10; i++) {
    const numPadded = String(i).padStart(2, '0');
    const codigoInv = `PC-LAB2-${numPadded}`;
    await prisma.equipo.upsert({
      where: { codigoInventario: codigoInv },
      update: {},
      create: {
        codigoInventario: codigoInv,
        nombre: 'Servidor / Nodo de Red',
        marca: 'HP',
        modelo: 'ProDesk 600',
        laboratorioId: lab2.id,
        estado: 'OPERATIVO',
        especificaciones: { procesador: 'Intel Core i5', ram: '8GB', almacenamiento: 'SSD 256GB' }
      }
    });
  }

  console.log('✅ Inventario inicial de equipos inyectado en laboratorios.');

  // =========================================================================
  // 7. CONFIGURACIÓN DE USUARIOS Y ÁMBITOS DE GRANULARIDAD FINA
  // =========================================================================
  const userAdmin = await prisma.usuario.upsert({
    where: { correo: 'admin.syslab@uajms.edu.bo' },
    update: {},
    create: { 
      nombre: 'Administrador Central', 
      correo: 'admin.syslab@uajms.edu.bo', 
      password: DUMMY_PASSWORD_HASH, 
      rolId: rolAdmin.id,
      esGlobal: true 
    }
  });

  let ambitoAdmin = await prisma.asignacionAmbito.findFirst({
    where: { usuarioId: userAdmin.id }
  });

  if (!ambitoAdmin) {
    await prisma.asignacionAmbito.create({
      data: { usuarioId: userAdmin.id, rolId: rolAdmin.id }
    });
  } else {
    await prisma.asignacionAmbito.update({
      where: { id: ambitoAdmin.id },
      data: { rolId: rolAdmin.id }
    });
  }

  const userJefe = await prisma.usuario.upsert({
    where: { correo: 'elias.cassal@uajms.edu.bo' },
    update: {},
    create: { 
      nombre: 'Elias Cassal Baldiviezo', 
      correo: 'elias.cassal@uajms.edu.bo', 
      password: DUMMY_PASSWORD_HASH, 
      rolId: rolJefe.id,
      esGlobal: false 
    }
  });

  let ambitoJefe = await prisma.asignacionAmbito.findFirst({
    where: { usuarioId: userJefe.id }
  });

  if (!ambitoJefe) {
    await prisma.asignacionAmbito.create({
      data: {
        usuarioId: userJefe.id,
        rolId: rolJefe.id,
        facultadId: facNaturales.id,
        carreraId: carreraInfoId
      }
    });
  } else {
    await prisma.asignacionAmbito.update({
      where: { id: ambitoJefe.id },
      data: { 
        rolId: rolJefe.id, 
        facultadId: facNaturales.id, 
        carreraId: carreraInfoId 
      }
    });
  }

  const listaDocentes = [
    { nombre: 'Yovana Sanchez', correo: 'yovana.sanchez@uajms.edu.bo' },
    { nombre: 'Cesar Santos', correo: 'cesar.santos@uajms.edu.bo' },
    { nombre: 'Juan Carlos Jaramillo', correo: 'juancarlos.jaramillo@uajms.edu.bo' },
    { nombre: 'Roberth Farfán', correo: 'roberth.farfan@uajms.edu.bo'},
    { nombre: 'Renzo Espinoza', correo: 'renzo.espinoza@uajms.edu.bo' },
    { nombre: 'Pedro Arenas', correo: 'pedro.arenas@uajms.edu.bo'},
    { nombre: 'Ronald Cruz', correo: 'ronald.cruz@uajms.edu.bo' },
    { nombre: 'Jhenny Castillo', correo: 'jhenny.castillo@uajms.edu.bo' },
    { nombre: 'Jose Luis Narvaez', correo: 'jose.narvaez@uajms.edu.bo' },
    { nombre: 'Guiver Calderon', correo: 'guiver.calderon@uajms.edu.bo' },
    { nombre: 'Emilse Aguirre', correo: 'emilse.aguirre@uajms.edu.bo' },
    { nombre: 'Silvia Olivera', correo: 'silvia.olivera@uajms.edu.bo' },
    { nombre: 'Mises Huanca', correo: 'mises.huanca@uajms.edu.bo' },
    { nombre: 'Nestor Bernal', correo: 'nestor.bernal@uajms.edu.bo' },
    { nombre: 'Arturo Prudencio', correo: 'arturo.prudencio@uajms.edu.bo' }
  ];

  for (const doc of listaDocentes) {
    const nombreCompleto = doc.especialidad ? `${doc.nombre} (${doc.especialidad})` : doc.nombre;
    const docenteCreado = await prisma.usuario.upsert({
      where: { correo: doc.correo },
      update: { nombre: nombreCompleto, rolId: rolDocente.id },
      create: {
        nombre: nombreCompleto,
        correo: doc.correo,
        password: DUMMY_PASSWORD_HASH,
        rolId: rolDocente.id,
        esGlobal: false
      }
    });

    let ambitoDocente = await prisma.asignacionAmbito.findFirst({
      where: { usuarioId: docenteCreado.id }
    });

    if (!ambitoDocente) {
      await prisma.asignacionAmbito.create({
        data: {
          usuarioId: docenteCreado.id,
          rolId: rolDocente.id,
          facultadId: facNaturales.id,
          carreraId: carreraInfoId
        }
      });
    } else {
      await prisma.asignacionAmbito.update({
        where: { id: ambitoDocente.id },
        data: { 
          rolId: rolDocente.id, 
          facultadId: facNaturales.id, 
          carreraId: carreraInfoId 
        }
      });
    }
  }

  console.log(`✅ ${listaDocentes.length + 2} Usuarios y docentes procesados correctamente bajo el esquema unificado.`);
  console.log('🚀 ¡Seeding completado con total éxito y robustez idempotente!');
}

main()
  .catch((e) => {
    console.error('❌ Error crítico en el proceso de seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });