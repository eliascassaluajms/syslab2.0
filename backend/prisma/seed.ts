import pkg from 'pg';
const { Pool } = pkg;
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

import { seedSeguridad } from './seeds/01-seguridad.seed.js';
import { seedEstructura } from './seeds/02-estructura.seed.js';
import { seedPlanes } from './seeds/03-planes.seed.js';
import { seedUsuarios } from './seeds/04-usuarios.seed.js';
import { seedEventos } from './seeds/05-eventos.seed.js'; // 👈 1. Importar seedEventos

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
    
    // Obtener el ID del usuario admin creado en el paso 4
    adminUserId = usuariosRes?.userAdmin?.id || 1;
  } else {
    console.warn('⚠️  Faltan carreraInfoId o facultadId para crear usuarios y equipos.');
  }

  // Paso 5: Módulo de Categorías, Eventos y Actividades (CITREN)
  if (carreraInfoId && adminUserId) {
    await seedEventos(prisma, carreraInfoId, adminUserId); // 👈 2. Invocar seedEventos
  } else {
    console.warn('⚠️  No se ejecutó seedEventos debido a falta de carreraInfoId o adminUserId.');
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