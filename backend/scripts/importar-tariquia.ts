// backend/scripts/importar-tariquia.ts
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import bcrypt from 'bcrypt';
import pkg from 'pg';
const { Pool } = pkg;
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, EstadoInscripcionMateria } from '@prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface TariquiaRow {
  RU: string;
  CI: string;
  NOMBRES: string;
  APELLIDOS: string;
  CORREO?: string;
  COD_MATERIA: string;
  GRUPO: string;
  SEMESTRE: string;
  GESTION: string;
}

async function importarDesdeTariquia(rutaCsv: string) {
  console.log(`🚀 Iniciando importación de datos Tariquía desde: ${rutaCsv}`);

  // 1. Obtener o crear el Rol Estudiante
  let rolEstudiante = await prisma.rol.findUnique({ where: { nombre: 'Estudiante' } });
  if (!rolEstudiante) {
    rolEstudiante = await prisma.rol.create({
      data: {
        nombre: 'Estudiante',
        descripcion: 'Estudiante regular matriculado en asignaturas',
      },
    });
  }

  // 2. Hash por defecto para estudiantes (ej. su CI o clave inicial)
  const passwordDefault = await bcrypt.hash('Uajms2026*', 10);

  const filas: TariquiaRow[] = [];

  fs.createReadStream(rutaCsv)
    .pipe(csv())
    .on('data', (data) => filas.push(data))
    .on('end', async () => {
      console.log(`📄 Filas leídas del archivo: ${filas.length}`);

      // Cachear materias existentes en memoria para evitar saturar la base de datos
      const materias = await prisma.materia.findMany({ select: { id: true, codigo: true } });
      const materiaMap = new Map(materias.map((m) => [m.codigo.trim().toUpperCase(), m.id]));

      let creados = 0;
      let inscripciones = 0;
      let errores = 0;

      for (const fila of filas) {
        try {
          const ru = fila.RU?.trim();
          const codMateria = fila.COD_MATERIA?.trim().toUpperCase();
          const grupo = parseInt(fila.GRUPO || '1', 10);
          const semestre = parseInt(fila.SEMESTRE || '1', 10);
          const gestion = parseInt(fila.GESTION || '2026', 10);

          if (!ru || !codMateria) {
            console.warn(`⚠️ Fila incompleta ignorada: RU=${ru}, MATERIA=${codMateria}`);
            errores++;
            continue;
          }

          const materiaId = materiaMap.get(codMateria);
          if (!materiaId) {
            console.warn(`⚠️ Materia no encontrada en el sistema: "${codMateria}". Registre el plan primero.`);
            errores++;
            continue;
          }

          const correo = fila.CORREO?.trim() || `${ru}@uajms.edu.bo`;
          const username = ru;

          // 3. Upsert del Estudiante
          const estudiante = await prisma.usuario.upsert({
            where: { username },
            update: {
              nombre: fila.NOMBRES?.trim() || 'Estudiante',
              apellido: fila.APELLIDOS?.trim() || 'UAJMS',
              activo: true,
            },
            create: {
              nombre: fila.NOMBRES?.trim() || 'Estudiante',
              apellido: fila.APELLIDOS?.trim() || 'UAJMS',
              username,
              correo,
              password: passwordDefault,
              rolId: rolEstudiante.id,
              activo: true,
              esGlobal: false,
            },
          });

          // 4. Registrar la programación de la materia
          await prisma.inscripcionMateria.upsert({
            where: {
              estudianteId_materiaId_grupo_semestre_gestion: {
                estudianteId: estudiante.id,
                materiaId,
                grupo,
                semestre,
                gestion,
              },
            },
            update: {
              estado: EstadoInscripcionMateria.ACTIVA,
            },
            create: {
              estudianteId: estudiante.id,
              materiaId,
              grupo,
              semestre,
              gestion,
              estado: EstadoInscripcionMateria.ACTIVA,
            },
          });

          inscripciones++;
        } catch (error) {
          console.error(`❌ Error procesando registro RU ${fila.RU}:`, error);
          errores++;
        }
      }

      console.log('\n📊 Resumen de la Carga:');
      console.log(`  ├─ Total de inscripciones procesadas: ${inscripciones}`);
      console.log(`  └─ Registros con error/omitidos: ${errores}\n`);

      await prisma.$disconnect();
      await pool.end();
    });
}

const archivo = process.argv[2] || path.join(process.cwd(), 'datos_tariquia.csv');
importarDesdeTariquia(archivo).catch(console.error);