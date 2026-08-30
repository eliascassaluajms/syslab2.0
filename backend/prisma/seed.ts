import pkg from 'pg';
const { Pool } = pkg;
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

import { seedSeguridad } from './seeds/01-seguridad.seed.js';
import { seedEstructura } from './seeds/02-estructura.seed.js';
import { seedPlanes } from './seeds/03-planes.seed.js';
import { seedUsuarios } from './seeds/04-usuarios.seed.js';

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🚀 Iniciando proceso global de sembrado de datos (Seeding)...\n');

  // Paso 1: Módulo de Seguridad y Accesos (se añade rolDirectorCarrera)
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
  if (carreraInfoId && facultadId) {
    await seedUsuarios(prisma, {
      rolAdminId: rolAdmin.id,
      rolJefeId: rolJefe.id,
      rolDocenteId: rolDocente.id,
      rolDirectorCarreraId: rolDirectorCarrera.id, // 👈 Se agrega este campo requerido
      carreraInfoId,
      facultadId,
      labs,
      passwordHash: DUMMY_PASSWORD_HASH
    });
  } else {
    console.warn('⚠️  Faltan carreraInfoId o facultadId para crear usuarios y equipos.');
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