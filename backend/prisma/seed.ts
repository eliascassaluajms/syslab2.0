import pkg from 'pg';
const { Pool } = pkg;
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

import { seedSeguridad } from './seeds/01-seguridad.seed.js';
import { seedEstructura } from './seeds/02-estructura.seed.js';
import { seedPlanes } from './seeds/03-planes.seed.js';
import { seedUsuarios } from './seeds/04-usuarios.seed.js';
import { seedEventos } from './seeds/05-eventos.seed.js';
import { seedDesignaciones } from './seeds/06-designaciones.seed.js';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🚀 Iniciando proceso global de sembrado de datos (Seeding)...\n');

  // Paso 1: Módulo de Seguridad y Accesos
  const { rolAdmin, rolJefe, rolDocente, rolDirectorCarrera, DUMMY_PASSWORD_HASH } = await seedSeguridad(prisma);

  // Paso 2: Módulo de Estructura Institucional y Laboratorios
  const { carreraInfoId, facultadId, labs } = await seedEstructura(prisma);

  // Paso 3: Módulo de Planes de Estudio y Materias
  if (carreraInfoId) {
    await seedPlanes(prisma, carreraInfoId);
  } else {
    console.warn('⚠️  No se encontró la carrera "Ingeniería Informática" para asignar planes.');
  }

  // Paso 4: Módulo de Usuarios, Docentes e Inventario de Equipos
  let adminUserId: number | undefined;

  if (carreraInfoId && facultadId) {
    const usuariosRes = await seedUsuarios(prisma, {
      rolAdminId: rolAdmin.id,
      rolJefeId: rolJefe.id,
      rolDocenteId: rolDocente.id,
      rolDirectorCarreraId: rolDirectorCarrera.id,
      carreraInfoId,
      facultadId,
      labs,
      passwordHash: DUMMY_PASSWORD_HASH
    });
    
    adminUserId = usuariosRes?.userAdmin?.id || 1;
  } else {
    console.warn('⚠️  Faltan carreraInfoId o facultadId para crear usuarios y equipos.');
  }

  // Paso 5: Módulo de Categorías, Eventos y Actividades (CITREN)
  if (carreraInfoId && adminUserId) {
    await seedEventos(prisma, carreraInfoId, adminUserId);
  } else {
    console.warn('⚠️  No se ejecutó seedEventos debido a falta de carreraInfoId o adminUserId.');
  }

  // Paso 6: Módulo de Designaciones Docentes Tariquía 2026
  if (carreraInfoId) {
    await seedDesignaciones(prisma, carreraInfoId);
  } else {
    console.warn('⚠️  No se ejecutó seedDesignaciones debido a falta de carreraInfoId.');
  }

  console.log('\n✨ ¡Proceso de Seeding completado con éxito!');
}

main()
  .catch((e) => {
    console.error('❌ Error durante la ejecución del Seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
