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

  const [rolesExistentes, usuariosExistentes, permisosExistentes] = await Promise.all([
    prisma.rol.count(),
    prisma.usuario.count(),
    prisma.permiso.count(),
  ]);

  const tieneDatosBase = rolesExistentes > 0 || usuariosExistentes > 0 || permisosExistentes > 0;
  if (tieneDatosBase) {
    console.log('🧱 La base de datos ya tiene datos base. Se omite el seeding para no sobrescribir información existente.');
    return;
  }

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
  for (const p of permisosCreados) {
    await prisma.rolPermiso.create({ data: { rolId: rolAdmin.id, permisoId: p.id } });
  }

  const codigosJefe = [
    'laboratorios:crear', 'laboratorios:listar', 'laboratorios:editar', 'laboratorios:ver_estado',
    'equipos:crear', 'equipos:listar', 'equipos:editar', 'equipos:eliminar',
    'materias:crear', 'materias:listar', 'materias:editar',
    'horarios:crear', 'horarios:listar', 'horarios:editar',
    'fallas:crear', 'fallas:listar', 'fallas:editar', 'fallas:ver_reportes',
    'uso_laboratorios:crear', 'uso_laboratorios:listar', 'uso_laboratorios:editar'
  ];
  
  const codigosDocente = [
    'laboratorios:listar', 'laboratorios:ver_estado',
    'equipos:listar',
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
  // 5. ESTRUCTURA INSTITUCIONAL (Facultades, Carreras y Laboratorios)
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

  const lab1 = await prisma.laboratorio.create({
    data: {
      codigo: 'LAB-1',
      nombre: 'Laboratorio 1 Ing Agronómica / Computación',
      ubicacion: 'Calle Jacinto Delfín, Campus Yacuiba',
      capacidad: 25,
      facultadId: facNaturales.id,
      carreraId: carreraInfoId
    }
  });

  const lab2 = await prisma.laboratorio.create({
    data: {
      codigo: 'LAB-2',
      nombre: 'Laboratorio de Redes y Computación Avanzada',
      ubicacion: 'Campus Universitario Yacuiba',
      capacidad: 20,
      facultadId: facNaturales.id,
      carreraId: carreraInfoId
    }
  });

  console.log('✅ Facultades, Carreras y Laboratorios institucionales cargados.');

  // =========================================================================
  // 6. INVENTARIO DE EQUIPOS EN LABORATORIOS
  // =========================================================================
  for (let i = 1; i <= 20; i++) {
    const numPadded = String(i).padStart(2, '0');
    await prisma.equipo.create({
      data: {
        codigoInventario: `PC-LAB1-${numPadded}`,
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
    await prisma.equipo.create({
      data: {
        codigoInventario: `PC-LAB2-${numPadded}`,
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
  const userAdmin = await prisma.usuario.create({
    data: { 
      nombre: 'Administrador Central', 
      correo: 'admin.syslab@uajms.edu.bo', 
      password: DUMMY_PASSWORD_HASH, 
      rolId: rolAdmin.id,
      esGlobal: true 
    }
  });
  await prisma.asignacionAmbito.create({
    data: { usuarioId: userAdmin.id, rolId: rolAdmin.id }
  });

  const userJefe = await prisma.usuario.create({
    data: { 
      nombre: 'Elias Cassal Baldiviezo', 
      correo: 'elias.cassal@uajms.edu.bo', 
      password: DUMMY_PASSWORD_HASH, 
      rolId: rolJefe.id,
      esGlobal: false 
    }
  });
  await prisma.asignacionAmbito.create({
    data: {
      usuarioId: userJefe.id,
      rolId: rolJefe.id,
      facultadId: facNaturales.id,
      carreraId: carreraInfoId
    }
  });

  const listaDocentes = [
    { nombre: 'Yovana Sanchez', correo: 'yovana.sanchez@uajms.edu.bo' },
    { nombre: 'Cesar Santos', correo: 'cesar.santos@uajms.edu.bo' },
    { nombre: 'Juan Carlos Jaramillo', correo: 'juancarlos.jaramillo@uajms.edu.bo' },
    { nombre: 'Roberth Farfán', correo: 'roberth.farfan@uajms.edu.bo', especialidad: 'Modelado y Simulación' },
    { nombre: 'Renzo Espinoza', correo: 'renzo.espinoza@uajms.edu.bo', especialidad: 'Sistemas de Información Geográfica / GIS' },
    { nombre: 'Pedro Arenas', correo: 'pedro.arenas@uajms.edu.bo', especialidad: 'Programación III' },
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
    const docenteCreado = await prisma.usuario.create({
      data: {
        nombre: nombreCompleto,
        correo: doc.correo,
        password: DUMMY_PASSWORD_HASH,
        rolId: rolDocente.id,
        esGlobal: false
      }
    });

    await prisma.asignacionAmbito.create({
      data: {
        usuarioId: docenteCreado.id,
        rolId: rolDocente.id,
        facultadId: facNaturales.id,
        carreraId: carreraInfoId
      }
    });
  }

  console.log(`✅ ${listaDocentes.length + 2} Usuarios y docentes inyectados correctamente bajo el esquema unificado.`);
  console.log('🚀 ¡Seeding completado con total éxito!');
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