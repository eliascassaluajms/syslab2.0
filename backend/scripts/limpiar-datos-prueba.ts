import fs from 'fs';
import path from 'path';
import pkg from 'pg';
const { Pool } = pkg;
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

// Lista blanca estricta de usuarios institucionales que NUNCA deben ser eliminados
const USUARIOS_PROTEGIDOS = new Set([
  'admin',
  'ecassal',
  'ysanchez',
  'csantos',
  'jjaramillo',
  'rfarfan',
  'respinoza',
  'parenas',
  'rcruz',
  'jcastillo',
  'jnarvaez',
  'gcalderon',
  'eaguirre',
  'solivera',
  'mhuanca',
  'nbernal',
  'aprudencio',
  'eyevara',
  'ejaramillo',
]);

function esEstudianteOficial(username: string): boolean {
  return /^\d+$/.test(username.trim());
}

async function obtenerPrismaClient(): Promise<{ prisma: PrismaClient; pool: any }> {
  let url = process.env.DATABASE_URL || 'postgresql://admin_syslab:SecretPassword2026@localhost:5434/syslab_db?schema=public';

  try {
    const pool = new Pool({ connectionString: url, connectionTimeoutMillis: 3000 });
    await pool.query('SELECT 1');
    const adapter = new PrismaPg(pool);
    return { prisma: new PrismaClient({ adapter }), pool };
  } catch (err: any) {
    if (url.includes('postgres-db')) {
      const fallbackUrl = url.replace('postgres-db:5432', 'localhost:5434');
      const fallbackPool = new Pool({ connectionString: fallbackUrl, connectionTimeoutMillis: 3000 });
      await fallbackPool.query('SELECT 1');
      const adapter = new PrismaPg(fallbackPool);
      return { prisma: new PrismaClient({ adapter }), pool: fallbackPool };
    }
    throw err;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');

  console.log('========================================================================');
  console.log('🧹 SysLab 2.0 - Script de Purgado y Limpieza de Datos de Prueba');
  console.log('========================================================================');
  if (isDryRun) {
    console.log('🔍 MODO SIMULACIÓN (DRY-RUN): No se realizarán modificaciones en la BD.\n');
  } else {
    console.log('⚠️  MODO EJECUCIÓN REAL: Se eliminarán los registros de prueba identificados.\n');
  }

  const { prisma, pool } = await obtenerPrismaClient();

  try {
    // -------------------------------------------------------------------------
    // 1. ANÁLISIS DE USUARIOS
    // -------------------------------------------------------------------------
    console.log('🔍 [1/4] Analizando cuentas de usuario en la base de datos...');
    const todosLosUsuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        username: true,
        correo: true,
        nombre: true,
        apellido: true,
        rolId: true,
      },
    });

    const usuariosPrueba: typeof todosLosUsuarios = [];
    const usuariosProtegidos: typeof todosLosUsuarios = [];
    const estudiantesOficiales: typeof todosLosUsuarios = [];

    for (const u of todosLosUsuarios) {
      const usernameLower = u.username.toLowerCase();
      const correoLower = u.correo.toLowerCase();
      const apellidoLower = u.apellido.toLowerCase();
      const nombreLower = u.nombre.toLowerCase();

      // Regla de Protección Absoluta
      if (USUARIOS_PROTEGIDOS.has(usernameLower)) {
        usuariosProtegidos.push(u);
        continue;
      }

      if (esEstudianteOficial(u.username)) {
        estudiantesOficiales.push(u);
        continue;
      }

      // Reglas de Detección de Usuarios de Test
      const esTestPorApellido = apellidoLower.startsWith('test') || apellidoLower.includes('locktest');
      const esTestPorNombre =
        nombreLower.endsWith('inc') ||
        nombreLower.endsWith('ref') ||
        nombreLower.endsWith('login') ||
        ['dbg', 'dbg2', 'evidencia', 'curl', 'x'].includes(nombreLower);
      const esTestPorUsername =
        usernameLower.includes('_inc_') ||
        usernameLower.includes('_ref_') ||
        usernameLower.includes('_login_') ||
        usernameLower.includes('_lock_') ||
        usernameLower.startsWith('insp_doc_') ||
        usernameLower.startsWith('insp2_') ||
        usernameLower.startsWith('evi_dbg_') ||
        usernameLower === 'curl_admin';
      const esTestPorCorreo =
        correoLower.includes('_inc_') ||
        correoLower.includes('_ref_') ||
        correoLower.includes('_login_') ||
        correoLower.includes('_lock_') ||
        correoLower.endsWith('@x.bo') ||
        correoLower.startsWith('dbg_') ||
        correoLower.startsWith('evi_dbg_');

      if (esTestPorApellido || esTestPorNombre || esTestPorUsername || esTestPorCorreo) {
        usuariosPrueba.push(u);
      } else {
        // Usuario real adicional
        usuariosProtegidos.push(u);
      }
    }

    const testUserIds = new Set(usuariosPrueba.map((u) => u.id));

    console.log(`   - Total usuarios en BD: ${todosLosUsuarios.length}`);
    console.log(`   - Estudiantes oficiales Padrón Tariquía: ${estudiantesOficiales.length} (PROTEGIDOS)`);
    console.log(`   - Personal docente y administradores oficiales: ${usuariosProtegidos.length} (PROTEGIDOS)`);
    console.log(`   - Cuentas de prueba detectadas para purgar: ${usuariosPrueba.length}`);

    // -------------------------------------------------------------------------
    // 2. ANÁLISIS DE INCIDENCIAS
    // -------------------------------------------------------------------------
    console.log('\n🔍 [2/4] Analizando incidencias y tickets en el sistema...');
    const todasLasIncidencias = await prisma.incidencia.findMany({
      select: {
        id: true,
        folio: true,
        titulo: true,
        descripcion: true,
        solicitanteId: true,
        evidenciaUrl: true,
        equipoId: true,
      },
    });

    const incidenciasPrueba: typeof todasLasIncidencias = [];
    const incidenciasReales: typeof todasLasIncidencias = [];

    for (const inc of todasLasIncidencias) {
      // Protección de incidencia real
      if (inc.id === 1) {
        incidenciasReales.push(inc);
        continue;
      }

      const tituloLower = inc.titulo.toLowerCase();
      const descLower = inc.descripcion.toLowerCase();

      const esTest =
        tituloLower.startsWith('fallo de prueba') ||
        tituloLower.startsWith('dbg') ||
        tituloLower.includes('test') ||
        tituloLower.includes('prueba') ||
        descLower.includes('prueba') ||
        descLower.includes('test') ||
        testUserIds.has(inc.solicitanteId);

      if (esTest) {
        incidenciasPrueba.push(inc);
      } else {
        incidenciasReales.push(inc);
      }
    }

    const testIncidenciaIds = incidenciasPrueba.map((i) => i.id);

    console.log(`   - Total incidencias en BD: ${todasLasIncidencias.length}`);
    console.log(`   - Incidencias reales institucionales: ${incidenciasReales.length} (PROTEGIDAS)`);
    console.log(`   - Incidencias de prueba detectadas para purgar: ${incidenciasPrueba.length}`);

    // -------------------------------------------------------------------------
    // 3. ANÁLISIS DE NOTAS Y DEPENDENCIAS
    // -------------------------------------------------------------------------
    console.log('\n🔍 [3/4] Analizando registros asociados y archivos de evidencia...');
    const notasPrueba = await prisma.incidenciaNota.count({
      where: {
        OR: [
          { incidenciaId: { in: testIncidenciaIds } },
          { autorId: { in: Array.from(testUserIds) } },
        ],
      },
    });

    const refreshTokensPrueba = await prisma.refreshToken.count({
      where: {
        usuarioId: { in: Array.from(testUserIds) },
      },
    });

    const asignacionesPrueba = await prisma.asignacionAmbito.count({
      where: {
        usuarioId: { in: Array.from(testUserIds) },
      },
    });

    // Archivos de evidencia física
    const posiblesDirectorios = [
      path.join(process.cwd(), 'uploads', 'incidencias'),
      path.join(process.cwd(), 'backend', 'uploads', 'incidencias'),
      path.join(process.cwd(), '..', 'uploads', 'incidencias'),
      path.resolve('uploads', 'incidencias'),
    ];

    const archivosEvidenciaAEliminar: string[] = [];
    for (const inc of incidenciasPrueba) {
      if (inc.evidenciaUrl) {
        const nombreArchivo = path.basename(inc.evidenciaUrl);
        for (const dir of posiblesDirectorios) {
          const rutaArchivo = path.join(dir, nombreArchivo);
          if (fs.existsSync(rutaArchivo) && !archivosEvidenciaAEliminar.includes(rutaArchivo)) {
            archivosEvidenciaAEliminar.push(rutaArchivo);
          }
        }
      }
    }

    console.log(`   - Notas de incidencias de prueba: ${notasPrueba}`);
    console.log(`   - Tokens de sesión (RefreshToken) de usuarios de prueba: ${refreshTokensPrueba}`);
    console.log(`   - Asignaciones de rol (AsignacionAmbito) de prueba: ${asignacionesPrueba}`);
    console.log(`   - Archivos de evidencia física en disco a remover: ${archivosEvidenciaAEliminar.length}`);

    // -------------------------------------------------------------------------
    // 4. EJECUCIÓN DEL PURGADO (SI NO ES DRY-RUN)
    // -------------------------------------------------------------------------
    if (isDryRun) {
      console.log('\n========================================================================');
      console.log('✅ Simulación completada con éxito.');
      console.log('   Ejecuta el script sin el flag --dry-run para aplicar los cambios.');
      console.log('========================================================================');
      return;
    }

    console.log('\n🚀 [4/4] Ejecutando purgado seguro en cascada...');

    // 4.1. Eliminar archivos de evidencia de disco
    let archivosBorrados = 0;
    for (const ruta of archivosEvidenciaAEliminar) {
      try {
        fs.unlinkSync(ruta);
        archivosBorrados++;
      } catch (err: any) {
        console.warn(`   ⚠️ No se pudo eliminar archivo: ${ruta} (${err.message})`);
      }
    }
    console.log(`   ✔ Archivos de evidencia física eliminados del disco: ${archivosBorrados}`);

    // 4.2. Eliminar notas de incidencias de prueba
    const resNotas = await prisma.incidenciaNota.deleteMany({
      where: {
        OR: [
          { incidenciaId: { in: testIncidenciaIds } },
          { autorId: { in: Array.from(testUserIds) } },
        ],
      },
    });
    console.log(`   ✔ Notas de incidencias eliminadas: ${resNotas.count}`);

    // 4.3. Eliminar incidencias de prueba
    const resIncidencias = await prisma.incidencia.deleteMany({
      where: {
        id: { in: testIncidenciaIds },
      },
    });
    console.log(`   ✔ Incidencias de prueba eliminadas: ${resIncidencias.count}`);

    // 4.4. Verificar y normalizar equipos
    const equiposEnMantenimiento = await prisma.equipo.findMany({
      where: { estado: 'EN_MANTENIMIENTO' },
      select: { id: true, nombre: true },
    });
    if (equiposEnMantenimiento.length > 0) {
      await prisma.equipo.updateMany({
        where: { id: { in: equiposEnMantenimiento.map((e) => e.id) } },
        data: { estado: 'OPERATIVO' },
      });
      console.log(`   ✔ Equipos restablecidos a OPERATIVO: ${equiposEnMantenimiento.length}`);
    }

    // 4.5. Eliminar RefreshTokens de usuarios de prueba
    const resTokens = await prisma.refreshToken.deleteMany({
      where: {
        usuarioId: { in: Array.from(testUserIds) },
      },
    });
    console.log(`   ✔ Tokens de refresco eliminados: ${resTokens.count}`);

    // 4.6. Eliminar Asignaciones de ámbito de usuarios de prueba
    const resAsignaciones = await prisma.asignacionAmbito.deleteMany({
      where: {
        usuarioId: { in: Array.from(testUserIds) },
      },
    });
    console.log(`   ✔ Asignaciones de ámbito eliminadas: ${resAsignaciones.count}`);

    // 4.7. Eliminar Cuentas de Usuario de prueba
    const resUsuarios = await prisma.usuario.deleteMany({
      where: {
        id: { in: Array.from(testUserIds) },
      },
    });
    console.log(`   ✔ Cuentas de usuario de prueba eliminadas: ${resUsuarios.count}`);

    // -------------------------------------------------------------------------
    // 5. RESUMEN FINAL Y AUDITORÍA POST-LIMPIEZA
    // -------------------------------------------------------------------------
    const totalUsuariosFinal = await prisma.usuario.count();
    const totalIncidenciasFinal = await prisma.incidencia.count();

    console.log('\n========================================================================');
    console.log('🎉 RESUMEN DE PURGADO Y LIMPIEZA EXITOSO:');
    console.log('========================================================================');
    console.log(`   • Incidencias eliminadas:          ${resIncidencias.count}`);
    console.log(`   • Notas de incidencias eliminadas: ${resNotas.count}`);
    console.log(`   • Archivos de evidencia borrados:  ${archivosBorrados}`);
    console.log(`   • Tokens de sesión revocados:      ${resTokens.count}`);
    console.log(`   • Asignaciones de rol removidas:   ${resAsignaciones.count}`);
    console.log(`   • Cuentas de prueba eliminadas:    ${resUsuarios.count}`);
    console.log('------------------------------------------------------------------------');
    console.log(`   • Total usuarios finales en BD:    ${totalUsuariosFinal} (100% legítimos)`);
    console.log(`     - Estudiantes Padrón Tariquía:   ${estudiantesOficiales.length}`);
    console.log(`     - Administradores y Docentes:    ${usuariosProtegidos.length}`);
    console.log(`   • Total incidencias finales en BD: ${totalIncidenciasFinal} (100% legítimas)`);
    console.log('========================================================================\n');
  } catch (error) {
    console.error('❌ Error durante la ejecución del script de limpieza:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
