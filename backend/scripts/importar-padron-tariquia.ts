import fs from 'fs';
import path from 'path';
import bcrypt from 'bcrypt';
import pkg from 'pg';
const { Pool } = pkg;
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Separador heurístico de apellidos bolivianos y nombres
function separarNombresApellidos(nombreCompleto: string): { nombres: string; apellidos: string } {
  const partes = nombreCompleto.trim().split(/\s+/);
  if (partes.length <= 2) {
    return { apellidos: partes[0] || 'UAJMS', nombres: partes.slice(1).join(' ') || 'Estudiante' };
  }
  // Casos típicos: Primeros dos términos son apellidos (Paterno y Materno)
  const apellidos = `${partes[0]} ${partes[1]}`;
  const nombres = partes.slice(2).join(' ');
  return { apellidos, nombres };
}

async function main() {
  const rutaTxt = process.argv[2] || 'estudiantes_tariquia_raw.txt';
  const archivo = path.isAbsolute(rutaTxt) ? rutaTxt : path.join(process.cwd(), rutaTxt);

  if (!fs.existsSync(archivo)) {
    console.error(`❌ No se encontró el archivo extraído: ${archivo}`);
    process.exit(1);
  }

  console.log('🎓 Procesando Padrón General de Estudiantes Tariquía 2026...\n');

  // 1. Obtener o crear rol Estudiante
  let rolEstudiante = await prisma.rol.findFirst({
    where: { nombre: { equals: 'Estudiante', mode: 'insensitive' } },
  });

  if (!rolEstudiante) {
    rolEstudiante = await prisma.rol.create({
      data: {
        nombre: 'Estudiante',
        descripcion: 'Estudiante regular matriculado en la facultad',
      },
    });
  }

  // 2. Obtener la carrera de Informática
  const carrera = await prisma.carrera.findFirst({
    where: { nombre: { contains: 'Informática', mode: 'insensitive' } },
  });

  if (!carrera) {
    throw new Error('No se encontró la Carrera de Informática en la base de datos.');
  }

  const defaultPasswordHash = await bcrypt.hash('Estudiante2026*', 10);
  const lineas = fs.readFileSync(archivo, 'utf-8').split('\n');

  let procesados = 0;
  let omitidos = 0;

  // Expresión regular para detectar líneas con formato: R.U. (5-6 dígitos) + Plan (2007|2024) + C.I. + NOMBRES
  const patronFila = /(\d{5,6})\s+(2007|2024)\s+(\d{6,10}(?:-\w+)?)\s+([A-ZÁÉÍÓÚÑ\s]+?)(?=\s+(?:FISCAL|EXCELENCIA|PARTICULAR|RURAL|CONVENIO|\d{2}-\d{2}-\d{4}|$))/;

  for (const linea of lineas) {
    const match = linea.match(patronFila);
    if (!match) continue;

    const ru = match[1].trim();
    const plan = match[2].trim();
    const ci = match[3].trim();
    const nombreCompleto = match[4].trim();

    if (!ru || nombreCompleto.length < 3) {
      omitidos++;
      continue;
    }

    const { nombres, apellidos } = separarNombresApellidos(nombreCompleto);
    const correo = `${ru}@uajms.edu.bo`;

    // 3. Upsert del estudiante
    const usuario = await prisma.usuario.upsert({
      where: { username: ru },
      update: {
        nombre: nombres,
        apellido: apellidos,
        activo: true,
      },
      create: {
        nombre: nombres,
        apellido: apellidos,
        username: ru,
        correo,
        password: defaultPasswordHash,
        rolId: rolEstudiante.id,
        activo: true,
        esGlobal: false,
      },
    });

    // 4. Asignación de ámbito perimetral a la carrera
    await prisma.asignacionAmbito.upsert({
      where: {
        usuarioId_rolId_facultadId_carreraId: {
          usuarioId: usuario.id,
          rolId: rolEstudiante.id,
          facultadId: carrera.facultadId,
          carreraId: carrera.id,
        },
      },
      update: {},
      create: {
        usuarioId: usuario.id,
        rolId: rolEstudiante.id,
        facultadId: carrera.facultadId,
        carreraId: carrera.id,
      },
    });

    procesados++;
  }

  console.log(`\n✨ Padrón procesado exitosamente:`);
  console.log(`  ├─ Estudiantes registrados/actualizados: ${procesados}`);
  console.log(`  └─ Líneas de encabezado o no concordantes: ${omitidos}\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error procesando el padrón:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
