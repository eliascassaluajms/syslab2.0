import bcrypt from 'bcryptjs';
import pkg from 'pg';
const { Pool } = pkg;
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const GESTION_HORARIOS = 2026;
const PASSWORD_ESTUDIANTES = 'SysLab2026*';

// Siglas oficiales del Plan 2024 (Malla Curricular Nueva), semestres 1 a 4.
// Fueron insertadas con plan_id = 2007 por el bug de descripcion.includes('2024').
const CODS_PLAN_2024 = [
  'DIC111', 'DIC112', 'EST116', 'FIS113', 'MAT114', 'MAT115',
  'DIC121', 'DIC122', 'DIC123', 'DIC126', 'FIS124', 'MAT125',
  'DIC211', 'DIC212', 'DIC213', 'MAT215', 'MAT216', 'DIC214',
  'DIC221', 'DIC222', 'DIC223', 'DIC224', 'MAT225', 'DIC226',
];

// Horarios piloto extraídos de "PERIODO 2 GESTION 2026.xlsx" (hoja 29-07), Plan 2024.
// Mapeo de laboratorios del Excel -> laboratorios de la BD:
//   LAB 3-B -> LAB-3 | LAB 1-JD -> LAB-1 | LAB 2-B -> LAB-2 | LAB 5-B -> LAB-5
const HORARIOS_PILOTO = [
  {
    sigla: 'DIC121', // PROGRAMACION II
    grupo: 1,
    totalGrupos: 2,
    semestre: 2,
    docente: 'jnarvaez', // NARVAEZ
    lab: 'LAB-3',
    dias: [
      ['Viernes', '11:00', '13:15'],
      ['Sábado', '08:00', '10:15'],
    ],
  },
  {
    sigla: 'DIC121', // PROGRAMACION II
    grupo: 2,
    totalGrupos: 2,
    semestre: 2,
    docente: 'parenas', // ARENAS
    lab: 'LAB-1',
    dias: [
      ['Lunes', '18:00', '19:30'],
      ['Martes', '18:00', '19:30'],
      ['Viernes', '18:00', '19:30'],
    ],
  },
  {
    sigla: 'DIC221', // PROGRAMACION IV
    grupo: 1,
    totalGrupos: 1,
    semestre: 4,
    docente: 'parenas', // ARENAS
    lab: 'LAB-2',
    dias: [
      ['Lunes', '10:00', '11:30'],
      ['Miércoles', '10:00', '11:30'],
      ['Viernes', '10:00', '11:30'],
    ],
  },
  {
    sigla: 'DIC226', // INTERNET DE LAS COSAS
    grupo: 1,
    totalGrupos: 1,
    semestre: 4,
    docente: 'jjaramillo', // JARAMILLO
    lab: 'LAB-5',
    dias: [
      ['Lunes', '11:30', '13:00'],
      ['Martes', '09:15', '10:45'],
    ],
  },
];

async function main() {
  console.log('🔧 Corrección de datos para la prueba piloto (Plan 2024) — Semestres 1-4\n');

  // 1. Localizar planes de estudio
  const plan2024 = await prisma.planEstudio.findFirst({ where: { gestion: 2024 } });
  const plan2007 = await prisma.planEstudio.findFirst({ where: { gestion: 2007 } });
  if (!plan2024) throw new Error('No se encontró el Plan de Estudios gestion=2024.');
  if (!plan2007) throw new Error('No se encontró el Plan de Estudios gestion=2007.');
  console.log(`📋 Plan 2007 id=${plan2007.id} | Plan 2024 id=${plan2024.id}`);

  // 2. Reasignar materias del catálogo real (sem 1-4) al Plan 2024
  const exactas = await prisma.materia.count({ where: { codigo: { in: CODS_PLAN_2024 } } });
  const reasignadas = await prisma.materia.updateMany({
    where: { codigo: { in: CODS_PLAN_2024 } },
    data: { planId: plan2024.id },
  });
  console.log(`📚 Materias Plan 2024 reasignadas: ${reasignadas.count} (de ${exactas} con sigla oficial)`);

  // 3. Asegurar que la malla NINF (inventada) no quede bajo plan 2024 ni contaminada en plan 2007
  const ninfMaterias = await prisma.materia.findMany({
    where: { codigo: { startsWith: 'NINF-' } },
    select: { id: true, codigo: true },
  });
  const ninfIds = ninfMaterias.map((m) => m.id);
  console.log(`🗑️  Materias NINF-* detectadas: ${ninfIds.length}`);

  if (ninfIds.length > 0) {
    const horariosNinf = await prisma.horario.deleteMany({ where: { materiaId: { in: ninfIds } } });
    const inscNinf = await prisma.inscripcionMateria.deleteMany({ where: { materiaId: { in: ninfIds } } });
    const delMaterias = await prisma.materia.deleteMany({ where: { id: { in: ninfIds } } });
    console.log(
      `   ├─ Horarios eliminados: ${horariosNinf.count}`
      + `\n   ├─ Inscripciones eliminadas: ${inscNinf.count}`
      + `\n   └─ Materias eliminadas: ${delMaterias.count}`
    );
  }

  // 4. Rehash de contraseñas de estudiantes (texto plano -> bcrypt)
  const rolEstudiante = await prisma.rol.findFirst({
    where: { nombre: { equals: 'Estudiante', mode: 'insensitive' } },
  });
  if (!rolEstudiante) throw new Error('No se encontró el rol "Estudiante".');
  const hash = bcrypt.hashSync(PASSWORD_ESTUDIANTES, 10);
  const actPass = await prisma.usuario.updateMany({
    where: { rolId: rolEstudiante.id },
    data: { password: hash },
  });
  console.log(`🔐 Contraseñas de estudiantes rehasheadas (bcrypt): ${actPass.count} (clave: ${PASSWORD_ESTUDIANTES})`);

  // 5. Recrear horarios piloto (idempotente: elimina los existentes de estas siglas + gestión)
  const siglasPiloto = [...new Set(HORARIOS_PILOTO.map((h) => h.sigla))];
  const borradosPrevios = await prisma.horario.deleteMany({
    where: {
      gestion: GESTION_HORARIOS,
      materia: { codigo: { in: siglasPiloto } },
    },
  });
  if (borradosPrevios.count > 0) {
    console.log(`♻️  Horarios previos removidos para recrear: ${borradosPrevios.count}`);
  }

  let creados = 0;
  for (const h of HORARIOS_PILOTO) {
    const materia = await prisma.materia.findUnique({ where: { codigo: h.sigla } });
    if (!materia) throw new Error(`Materia no encontrada: ${h.sigla}`);
    if (materia.planId !== plan2024.id) throw new Error(`Materia ${h.sigla} no está en el Plan 2024.`);

    const docente = await prisma.usuario.findUnique({ where: { username: h.docente } });
    if (!docente) throw new Error(`Docente no encontrado: ${h.docente}`);

    const lab = await prisma.laboratorio.findUnique({ where: { codigo: h.lab } });
    if (!lab) throw new Error(`Laboratorio no encontrado: ${h.lab}`);

    for (const [dia, horaInicio, horaFin] of h.dias) {
      await prisma.horario.create({
        data: {
          laboratorioId: lab.id,
          materiaId: materia.id,
          docenteId: docente.id,
          diaSemana: dia,
          horaInicio,
          horaFin,
          grupo: h.grupo,
          totalGrupos: h.totalGrupos,
          semestre: h.semestre,
          gestion: GESTION_HORARIOS,
        },
      });
      creados++;
    }
    console.log(
      `   └─ ${h.sigla} g${h.grupo} (${materia.nombre}) -> ${h.lab} / ${h.docente}: ${h.dias.length} bloques`
    );
  }
  console.log(`🕒 Horarios piloto creados: ${creados}`);

  // 6. Resumen final + verificación interna
  const totalMaterias2024 = await prisma.materia.count({ where: { planId: plan2024.id } });
  const totalMaterias2007 = await prisma.materia.count({ where: { planId: plan2007.id } });
  const totalNinf = await prisma.materia.count({ where: { codigo: { startsWith: 'NINF-' } } });
  const totalHorarios = await prisma.horario.count();
  const estudiantesMal = await prisma.usuario.count({
    where: { rolId: rolEstudiante.id, password: { startsWith: '$' } },
  });
  const ejemplo = await prisma.usuario.findFirst({
    where: { rolId: rolEstudiante.id },
    select: { username: true, password: true },
  });

  console.log('\n📊 Resumen final:');
  console.log(`   ├─ Materias Plan 2024: ${totalMaterias2024} | Plan 2007: ${totalMaterias2007} | NINF: ${totalNinf}`);
  console.log(`   ├─ Horarios totales (gestion ${GESTION_HORARIOS}): ${totalHorarios}`);
  console.log(`   ├─ Estudiantes con password bcrypt: ${estudiantesMal}`);
  console.log(`   └─ Ejemplo estudiante: ${ejemplo?.username} -> ${ejemplo?.password?.slice(0, 10)}...`);

  console.log('\n✅ Corrección completada.');
}

main()
  .catch((e) => {
    console.error('❌ Error durante la corrección:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });