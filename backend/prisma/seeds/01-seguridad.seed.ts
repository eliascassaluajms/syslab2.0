import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const DUMMY_PASSWORD_HASH = bcrypt.hashSync('SysLab2026*', 10);

export async function seedSeguridad(prisma: PrismaClient) {
  console.log('🔒 Cargando datos del módulo de Seguridad...');

  // =========================================================================
  // 1. PERMISOS MAESTROS
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
    { codigo: 'actividades:pagos_validar', descripcion: 'Permite validar, aprobar o rechazar pagos de inscripción' },
    { codigo: 'solicitudes:crear', descripcion: 'Permite solicitar horarios extraordinarios' },
    { codigo: 'solicitudes:listar', descripcion: 'Permite ver las solicitudes de horarios extraordinarios' },
    { codigo: 'solicitudes:aprobar', descripcion: 'Permite aprobar o rechazar solicitudes extraordinarias de uso de laboratorio' },
    { codigo: 'bitacora:iniciar', descripcion: 'Permite iniciar una sesión de uso de laboratorio y generar código QR' },
    { codigo: 'bitacora:finalizar', descripcion: 'Permite finalizar una sesión de bitácora de laboratorio' },
    { codigo: 'bitacora:consultar', descripcion: 'Permite consultar sesiones de bitácora' }
  ];

  const permisosCreados = [];
  for (const p of listaPermisos) {
    const permiso = await prisma.permiso.upsert({
      where: { codigo: p.codigo },
      update: { descripcion: p.descripcion },
      create: p
    });
    permisosCreados.push(permiso);
  }
  console.log(`  └─ ✅ ${permisosCreados.length} Permisos procesados.`);

  // =========================================================================
  // 2. ROLES BASE
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

  console.log('  └─ ✅ Roles base procesados.');

  // =========================================================================
  // 3. ASIGNACIÓN MATRIZ: ROL - PERMISO
  // =========================================================================
  for (const p of permisosCreados) {
    await prisma.rolPermiso.upsert({
      where: { rolId_permisoId: { rolId: rolAdmin.id, permisoId: p.id } },
      update: {},
      create: { rolId: rolAdmin.id, permisoId: p.id }
    });
  }

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
        'materias:crear', 'materias:listar', 'materias:editar', 'materias:eliminar',
        'planes_estudio:crear', 'planes_estudio:listar', 'planes_estudio:editar', 'planes_estudio:eliminar',
        'horarios:crear', 'horarios:listar', 'horarios:editar', 'horarios:eliminar',
        'laboratorios:listar', 'laboratorios:ver_estado', 'laboratorios:editar',
        'uso_laboratorios:crear', 'uso_laboratorios:listar', 'uso_laboratorios:editar', 'uso_laboratorios:eliminar',
        'fallas:crear', 'fallas:listar', 'fallas:editar', 'fallas:ver_reportes',
        'actividades:categorias_listar', 'actividades:categorias_crear', 'actividades:categorias_editar', 'actividades:categorias_eliminar',
        'actividades:listar', 'actividades:crear', 'actividades:editar', 'actividades:eliminar',
        'actividades:participantes_listar', 'actividades:participantes_registrar',
        'actividades:pagos_registrar', 'actividades:pagos_validar',
        'solicitudes:crear', 'solicitudes:listar', 'solicitudes:aprobar',
        'bitacora:iniciar', 'bitacora:finalizar', 'bitacora:consultar'
      ]
    },
    {
      rolId: rolJefe.id,
      codigos: [
        'laboratorios:crear', 'laboratorios:listar', 'laboratorios:editar', 'laboratorios:eliminar', 'laboratorios:ver_estado',
        'equipos:crear', 'equipos:listar', 'equipos:editar', 'equipos:eliminar',
        'materias:crear', 'materias:listar', 'materias:editar', 'materias:eliminar',
        'horarios:crear', 'horarios:listar', 'horarios:editar', 'horarios:eliminar',
        'planes_estudio:crear', 'planes_estudio:listar', 'planes_estudio:editar', 'planes_estudio:eliminar',
        'fallas:crear', 'fallas:listar', 'fallas:editar', 'fallas:eliminar', 'fallas:ver_reportes',
        'uso_laboratorios:crear', 'uso_laboratorios:listar', 'uso_laboratorios:editar', 'uso_laboratorios:eliminar',
        'actividades:categorias_listar', 'actividades:categorias_crear', 'actividades:categorias_editar', 'actividades:categorias_eliminar',
        'actividades:listar', 'actividades:crear', 'actividades:editar', 'actividades:eliminar',
        'actividades:participantes_listar', 'actividades:participantes_registrar',
        'actividades:pagos_registrar', 'actividades:pagos_validar',
        'solicitudes:crear', 'solicitudes:listar', 'solicitudes:aprobar',
        'bitacora:iniciar', 'bitacora:finalizar', 'bitacora:consultar'
      ]
    },
    {
      rolId: rolTecnico.id,
      codigos: [
        'laboratorios:listar', 'laboratorios:ver_estado', 'equipos:listar', 'equipos:editar',
        'fallas:crear', 'fallas:listar', 'fallas:editar', 'uso_laboratorios:listar', 'bitacora:consultar'
      ]
    },
    {
      rolId: rolDocente.id,
      codigos: [
        'laboratorios:listar', 'laboratorios:ver_estado', 'equipos:listar', 'horarios:listar',
        'fallas:crear', 'fallas:listar', 'uso_laboratorios:crear', 'uso_laboratorios:listar',
        'actividades:listar', 'actividades:participantes_registrar',
        'solicitudes:crear', 'solicitudes:listar',
        'bitacora:iniciar', 'bitacora:finalizar', 'bitacora:consultar'
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
        'actividades:listar', 'actividades:participantes_registrar', 'actividades:pagos_registrar',
        'bitacora:consultar'
      ]
    }
  ];

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

  console.log('  └─ ✅ Matriz de permisos vinculada exitosamente a todos los roles.');
  console.log('✅ Permisos, roles y matriz de accesos procesados con éxito.\n');

  return { rolAdmin, rolJefe, rolDocente, rolDirectorCarrera, DUMMY_PASSWORD_HASH };
}
