import pkg from 'pg';
const { Pool } = pkg;
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, TipoPeriodoDesignacion } from '@prisma/client';
import bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface DesignacionItem {
  sigla: string;
  materiaNombre: string;
  semestre: number;
  grupo: number;
  periodo: TipoPeriodoDesignacion;
  docenteCorreo: string;
  docenteNombre: string;
  docenteApellido: string;
  horas: number;
}

const DESIGNACIONES_TARIQUIA_2026: DesignacionItem[] = [
  // Arenas Mendoza Pedro
  { sigla: 'INF423', materiaNombre: 'Tecnología de Programación en Red', semestre: 8, grupo: 1, periodo: TipoPeriodoDesignacion.SEMESTRE_2, docenteCorreo: 'pedro.arenas@uajms.edu.bo', docenteNombre: 'Pedro', docenteApellido: 'Arenas', horas: 4 },
  { sigla: 'TEL520', materiaNombre: 'Tecnologías Móvil', semestre: 10, grupo: 1, periodo: TipoPeriodoDesignacion.SEMESTRE_2, docenteCorreo: 'pedro.arenas@uajms.edu.bo', docenteNombre: 'Pedro', docenteApellido: 'Arenas', horas: 4 },

  // Cassal Baldiviezo Elias
  { sigla: 'ECO321', materiaNombre: 'Preparación y Evaluación de Proyectos', semestre: 6, grupo: 1, periodo: TipoPeriodoDesignacion.SEMESTRE_2, docenteCorreo: 'jefe.labs@uajms.edu.bo', docenteNombre: 'Elias', docenteApellido: 'Cassal Baldiviezo', horas: 4 },
  { sigla: 'TEL420', materiaNombre: 'Sistemas Paralelos', semestre: 8, grupo: 1, periodo: TipoPeriodoDesignacion.SEMESTRE_2, docenteCorreo: 'jefe.labs@uajms.edu.bo', docenteNombre: 'Elias', docenteApellido: 'Cassal Baldiviezo', horas: 4 },

  // Castillo Tapia Jhenny Rosmery
  { sigla: 'INF322', materiaNombre: 'Análisis de Sistemas II', semestre: 6, grupo: 1, periodo: TipoPeriodoDesignacion.SEMESTRE_2, docenteCorreo: 'jhenny.castillo@uajms.edu.bo', docenteNombre: 'Jhenny', docenteApellido: 'Castillo', horas: 6 },
  { sigla: 'INF521', materiaNombre: 'Auditoría Informática', semestre: 10, grupo: 1, periodo: TipoPeriodoDesignacion.SEMESTRE_2, docenteCorreo: 'jhenny.castillo@uajms.edu.bo', docenteNombre: 'Jhenny', docenteApellido: 'Castillo', horas: 5 },

  // Cruz Delgado Ronald Yeber
  { sigla: 'INF301', materiaNombre: 'Taller I', semestre: 5, grupo: 1, periodo: TipoPeriodoDesignacion.ANUAL, docenteCorreo: 'ronald.cruz@uajms.edu.bo', docenteNombre: 'Ronald', docenteApellido: 'Cruz', horas: 6 },
  { sigla: 'INF501', materiaNombre: 'Taller III', semestre: 9, grupo: 1, periodo: TipoPeriodoDesignacion.ANUAL, docenteCorreo: 'ronald.cruz@uajms.edu.bo', docenteNombre: 'Ronald', docenteApellido: 'Cruz', horas: 6 },

  // Espinoza Jose Renzo
  { sigla: 'INF401', materiaNombre: 'Taller II', semestre: 7, grupo: 2, periodo: TipoPeriodoDesignacion.ANUAL, docenteCorreo: 'renzo.espinoza@uajms.edu.bo', docenteNombre: 'Renzo', docenteApellido: 'Espinoza', horas: 6 },

  // Farfán Sivila Luis Robert
  { sigla: 'INF401', materiaNombre: 'Taller II', semestre: 7, grupo: 1, periodo: TipoPeriodoDesignacion.ANUAL, docenteCorreo: 'roberth.farfan@uajms.edu.bo', docenteNombre: 'Roberth', docenteApellido: 'Farfán', horas: 6 },
  { sigla: 'INF501', materiaNombre: 'Taller III', semestre: 9, grupo: 2, periodo: TipoPeriodoDesignacion.ANUAL, docenteCorreo: 'roberth.farfan@uajms.edu.bo', docenteNombre: 'Roberth', docenteApellido: 'Farfán', horas: 6 },
  { sigla: 'IEL421', materiaNombre: 'Laboratorio de Seguridad en Redes', semestre: 8, grupo: 1, periodo: TipoPeriodoDesignacion.SEMESTRE_2, docenteCorreo: 'roberth.farfan@uajms.edu.bo', docenteNombre: 'Roberth', docenteApellido: 'Farfán', horas: 5 },
  { sigla: 'MAT322', materiaNombre: 'Investigación Operativa II', semestre: 6, grupo: 1, periodo: TipoPeriodoDesignacion.SEMESTRE_2, docenteCorreo: 'roberth.farfan@uajms.edu.bo', docenteNombre: 'Roberth', docenteApellido: 'Farfán', horas: 4 },

  // Jaramillo Farfán Juan Carlos
  { sigla: 'IEL321', materiaNombre: 'Redes II', semestre: 6, grupo: 1, periodo: TipoPeriodoDesignacion.SEMESTRE_2, docenteCorreo: 'juancarlos.jaramillo@uajms.edu.bo', docenteNombre: 'Juan Carlos', docenteApellido: 'Jaramillo', horas: 5 },

  // Prudencio Nina Arturo
  { sigla: 'INF321', materiaNombre: 'Base de Datos II', semestre: 6, grupo: 1, periodo: TipoPeriodoDesignacion.SEMESTRE_2, docenteCorreo: 'arturo.prudencio@uajms.edu.bo', docenteNombre: 'Arturo', docenteApellido: 'Prudencio', horas: 6 },

  // Yevara Valdez Edwin Alberto
  { sigla: 'INF421', materiaNombre: 'Inteligencia Artificial', semestre: 8, grupo: 1, periodo: TipoPeriodoDesignacion.SEMESTRE_2, docenteCorreo: 'edwin.yevara@uajms.edu.bo', docenteNombre: 'Edwin', docenteApellido: 'Yevara Valdez', horas: 4 },
  { sigla: 'INF422', materiaNombre: 'Ingeniería de Software II', semestre: 8, grupo: 1, periodo: TipoPeriodoDesignacion.SEMESTRE_2, docenteCorreo: 'edwin.yevara@uajms.edu.bo', docenteNombre: 'Edwin', docenteApellido: 'Yevara Valdez', horas: 6 },
];

async function main() {
  console.log('📋 Iniciando registro de Designaciones Aprobadas de Docentes (Tariquía 2026)...\n');

  // 1. Obtener datos de contexto institucional
  const rolDocente = await prisma.rol.findFirst({ where: { nombre: 'Docente' } });
  if (!rolDocente) {
    throw new Error('No se encontró el rol "Docente" en la base de datos.');
  }

  const carrera = await prisma.carrera.findFirst({
    where: { nombre: { contains: 'Informática', mode: 'insensitive' } },
    include: { planesEstudio: { where: { activo: true } } },
  });

  if (!carrera || carrera.planesEstudio.length === 0) {
    throw new Error('No se encontró la Carrera de Informática o su Plan de Estudios activo.');
  }

  const planId = carrera.planesEstudio[0].id;
  const passwordHash = await bcrypt.hash('Docente2026*', 10);
  const gestion = 2026;

  let totalDesignaciones = 0;

  for (const item of DESIGNACIONES_TARIQUIA_2026) {
    // 2. Garantizar que el Docente existe
    const username = item.docenteCorreo.split('@')[0];
    const docente = await prisma.usuario.upsert({
      where: { correo: item.docenteCorreo },
      update: { activo: true },
      create: {
        nombre: item.docenteNombre,
        apellido: item.docenteApellido,
        username,
        correo: item.docenteCorreo,
        password: passwordHash,
        rolId: rolDocente.id,
        activo: true,
        esGlobal: false,
      },
    });

    // Asegurar ámbito de docente en la carrera
    await prisma.asignacionAmbito.upsert({
      where: {
        usuarioId_rolId_facultadId_carreraId: {
          usuarioId: docente.id,
          rolId: rolDocente.id,
          facultadId: carrera.facultadId,
          carreraId: carrera.id,
        },
      },
      update: {},
      create: {
        usuarioId: docente.id,
        rolId: rolDocente.id,
        facultadId: carrera.facultadId,
        carreraId: carrera.id,
      },
    });

    // 3. Garantizar que la Materia existe en el plan
    const materia = await prisma.materia.upsert({
      where: { codigo: item.sigla },
      update: {
        nombre: item.materiaNombre,
        semestre: item.semestre,
      },
      create: {
        codigo: item.sigla,
        nombre: item.materiaNombre,
        planId: planId,
        semestre: item.semestre,
        tipoPeriodo: item.periodo === TipoPeriodoDesignacion.ANUAL ? 'Anual' : 'Semestral',
      },
    });

    // 4. Registrar la Designación Académica
    await prisma.designacionMateria.upsert({
      where: {
        docenteId_materiaId_grupo_gestion_periodo: {
          docenteId: docente.id,
          materiaId: materia.id,
          grupo: item.grupo,
          gestion,
          periodo: item.periodo,
        },
      },
      update: { activo: true },
      create: {
        docenteId: docente.id,
        materiaId: materia.id,
        grupo: item.grupo,
        gestion,
        periodo: item.periodo,
        activo: true,
      },
    });

    totalDesignaciones++;
    console.log(`  ✔ [${item.sigla}] ${item.materiaNombre} - Grupo ${item.grupo} (${item.periodo}) ➔ ${item.docenteNombre} ${item.docenteApellido}`);
  }

  console.log(`\n✨ Proceso finalizado: ${totalDesignaciones} designaciones registradas exitosamente.`);
}

main()
  .catch((e) => {
    console.error('❌ Error al procesar designaciones:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
