// backend/prisma/seed.js
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

// Inicialización del Driver Adapter requerido en tu entorno Docker
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Hash seguro de Bcrypt para la contraseña genérica de pruebas: 'password123'
const DUMMY_PASSWORD_HASH = '$2b$10$EpjXfTzVv.4B1S3wD2tGKe0I4bXNnJj8mX94Xj1mO3N4O2O2O2O2O'; 

async function main() {
  console.log('🌱 Iniciando el proceso de Seeding (Datos Maestros SysLab 2.0)...');

  // =========================================================================
  // 1. LIMPIEZA DE TABLAS (En orden inverso para evitar fallos de claves foráneas)
  // =========================================================================
  await prisma.asignacionAmbito.deleteMany({});
  await prisma.usuarioCarrera.deleteMany({});
  await prisma.usuarioFacultad.deleteMany({});
  await prisma.usuario.deleteMany({});
  await prisma.rolPermiso.deleteMany({});
  await prisma.permiso.deleteMany({});
  await prisma.rol.deleteMany({});
  await prisma.carrera.deleteMany({});
  await prisma.facultad.deleteMany({});

  console.log('🧹 Base de datos limpia de registros previos.');

  // =========================================================================
  // 2. INYECCIÓN DE PERMISOS MAESTROS (KAN-07)
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
    { codigo: 'uso_laboratorios:eliminar', descripcion: 'Permite eliminar registros de bitácora' }
  ];

  const permisosCreados = [];
  for (const p of listaPermisos) {
    const permiso = await prisma.permiso.create({ data: p });
    permisosCreados.push(permiso);
  }
  console.log(`✅ ${permisosCreados.length} Permisos maestros inyectados.`);

  // =========================================================================
  // 3. CREACIÓN DE ROLES BASE
  // =========================================================================
  const rolAdmin = await prisma.rol.create({ data: { nombre: 'Administrador', descripcion: 'Acceso total global' } });
  const rolJefe = await prisma.rol.create({ data: { nombre: 'Jefe de Laboratorios', descripcion: 'Gestión operativa perimetralizada' } });
  const rolTecnico = await prisma.rol.create({ data: { nombre: 'Técnico', descripcion: 'Soporte e incidencias' } });
  const rolDocente = await prisma.rol.create({ data: { nombre: 'Docente', descripcion: 'Reserva y uso de ambientes' } });

  console.log('✅ Roles base insertados con éxito.');

  // =========================================================================
  // 4. ASIGNACIÓN MATRIZ: ROL - PERMISO
  // =========================================================================
  // El administrador hereda absolutamente todo el set
  for (const p of permisosCreados) {
    await prisma.rolPermiso.create({ data: { rolId: rolAdmin.id, permisoId: p.id } });
  }

  const codigosJefe = [
    'laboratorios:crear', 'laboratorios:listar', 'laboratorios:editar', 'laboratorios:ver_estado',
    'materias:crear', 'materias:listar', 'materias:editar',
    'horarios:crear', 'horarios:listar', 'horarios:editar',
    'fallas:crear', 'fallas:listar', 'fallas:editar', 'fallas:ver_reportes',
    'uso_laboratorios:crear', 'uso_laboratorios:listar', 'uso_laboratorios:editar'
  ];
  
  const codigosDocente = [
    'laboratorios:listar', 'laboratorios:ver_estado',
    'horarios:listar',
    'fallas:crear', 'fallas:listar',
    'uso_laboratorios:crear', 'uso_laboratorios:listar'
  ];

  for (const p of permisosCreados) {
    if (codigosJefe.includes(p.codigo)) {
      await prisma.rolPermiso.create({ data: { rolId: rolJefe.id, permisoId: p.id } });
    }
    if (codigosDocente.includes(p.codigo)) {
      await prisma.rolPermiso.create({ data: { rolId: rolDocente.id, permisoId: p.id } });
    }
  }
  console.log('✅ Matriz de permisos vinculada a los roles.');

  // =========================================================================
  // 5. ESTRUCTURA INSTITUCIONAL (Facultades y Carreras)
  // =========================================================================
  const facNaturales = await prisma.facultad.create({
    data: { nombre: 'Facultad de Ciencias de la Ingeniería de Recursos Naturales y Tecnologías', sigla: 'FCIRNT' }
  });

  const carrerasNaturales = [
    'Ingeniería Agronómica',
    'Ingeniería Informática',
    'Ingeniería Sanitaria y Ambiental',
    'Ingeniería de Recursos Hídricos'
  ];

  let carreraInfoId = null;
  for (const nombreCarrera of carrerasNaturales) {
    const carrera = await prisma.carrera.create({
      data: { nombre: nombreCarrera, facultadId: facNaturales.id }
    });
    if (nombreCarrera === 'Ingeniería Informática') {
      carreraInfoId = carrera.id;
    }
  }

  const facEmpresariales = await prisma.facultad.create({
    data: { nombre: 'Facultad de Ciencias Empresariales', sigla: 'FCE' }
  });

  const carrerasEmpresariales = [
    'Ingeniería Comercial',
    'Administración y Gestión Pública',
    'Contaduría Pública'
  ];

  for (const nombreCarrera of carrerasEmpresariales) {
    await prisma.carrera.create({
      data: { nombre: nombreCarrera, facultadId: facEmpresariales.id }
    });
  }

  console.log('✅ Facultades y Carreras institucionales cargadas.');

  // =========================================================================
  // 6. CONFIGURACIÓN DE USUARIOS BASE Y ÁMBITOS DE GRANULARIDAD FINA (KAN-08)
  // =========================================================================
  // Administrador Global
  const userAdmin = await prisma.usuario.create({
    data: { nombre: 'Administrador Central', correo: 'admin.syslab@uajms.edu', password: DUMMY_PASSWORD_HASH, rolId: rolAdmin.id }
  });
  await prisma.asignacionAmbito.create({
    data: { usuarioId: userAdmin.id, rolId: rolAdmin.id } // Ámbito total, campos de facultad y carrera nulos
  });

  // Usuario Jefe de Laboratorios (Mapeado a su contexto informático y de facultad)
  const userJefe = await prisma.usuario.create({
    data: { nombre: 'Elias Cassal Baldiviezo', correo: 'elias.cassal@uajms.edu', password: DUMMY_PASSWORD_HASH, rolId: rolJefe.id }
  });

  // Inyección en la tabla pivot de granularidad fina
  await prisma.asignacionAmbito.create({
    data: {
      usuarioId: userJefe.id,
      rolId: rolJefe.id,
      facultadId: facNaturales.id,
      carreraId: carreraInfoId
    }
  });

  // Inyección en las tablas espejo de asignación perimetral directa
  await prisma.usuarioFacultad.create({ data: { usuarioId: userJefe.id, facultadId: facNaturales.id } });
  await prisma.usuarioCarrera.create({ data: { usuarioId: userJefe.id, carreraId: carreraInfoId } });

  console.log('✅ Usuarios base creados con su respectivo Ámbito de Granularidad Fina.');
  console.log('🚀 ¡Seeding completado con total éxito!');
}main()
  .catch((e) => {
    console.error('❌ Error crítico en el proceso de seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });