import { prisma } from '../src/config/prisma.js';

async function main() {
  console.log('Iniciando la importación y sincronización de las 21 aulas de la facultad...');

  // 1. Verificar la Facultad FIRNT
  const facultad = await prisma.facultad.findFirst({
    where: { sigla: 'FIRNT' },
  });

  if (!facultad) {
    throw new Error('No se encontró la facultad FIRNT. Ejecute los seeds principales primero.');
  }

  // 2. Generar e insertar las 21 aulas de manera idempotente
  for (let i = 1; i <= 21; i++) {
    const numeroStr = i < 10 ? `0${i}` : `${i}`;
    const codigo = `AULA-${numeroStr}`;
    const nombre = `Aula Teórica ${i}`;
    const capacidad = i <= 10 ? 50 : 40; // Ejemplo de capacidad diferenciada

    await prisma.aula.upsert({
      where: { codigo },
      update: {
        nombre,
        capacidad,
        activo: true,
      },
      create: {
        codigo,
        nombre,
        ubicacion: `Planta Alta / Baja - Bloque Central`,
        capacidad,
        facultadId: facultad.id,
        activo: true,
      },
    });

    console.log(`Aula sincronizada: [${codigo}] ${nombre}`);
  }

  console.log('¡Importación de las 21 aulas finalizada exitosamente!');
}

main()
  .catch((e) => {
    console.error('Error al importar las aulas:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });