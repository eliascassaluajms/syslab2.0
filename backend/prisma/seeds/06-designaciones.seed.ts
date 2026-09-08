import { PrismaClient, TipoPeriodoDesignacion } from '@prisma/client';

export interface ItemDesignacionSeed {
  sigla: string;
  materiaNombre: string;
  semestre: number;
  grupo: number;
  periodo: TipoPeriodoDesignacion;
  docenteCorreo: string;
}

export const DESIGNACIONES_DATA: ItemDesignacionSeed[] = [
  // Pedro Arenas Mendoza
  { sigla: 'INF423', materiaNombre: 'TECNOLOGIA DE PROGRAMACION EN RED', semestre: 8, grupo: 1, periodo: TipoPeriodoDesignacion.SEMESTRE_2, docenteCorreo: 'pedro.arenas@uajms.edu.bo' },
  { sigla: 'TEL520', materiaNombre: 'TECNOLOGIAS MOVIL', semestre: 10, grupo: 1, periodo: TipoPeriodoDesignacion.SEMESTRE_2, docenteCorreo: 'pedro.arenas@uajms.edu.bo' },

  // Elias Cassal Baldiviezo
  { sigla: 'ECO321', materiaNombre: 'PREPARACION Y EVALUAC. DE PROYECTOS', semestre: 6, grupo: 1, periodo: TipoPeriodoDesignacion.SEMESTRE_2, docenteCorreo: 'jefe.labs@uajms.edu.bo' },
  { sigla: 'TEL420', materiaNombre: 'SISTEMAS PARALELOS', semestre: 8, grupo: 1, periodo: TipoPeriodoDesignacion.SEMESTRE_2, docenteCorreo: 'jefe.labs@uajms.edu.bo' },

  // Jhenny Rosmery Castillo Tapia
  { sigla: 'INF322', materiaNombre: 'ANALISIS DE SISTEMAS II', semestre: 6, grupo: 1, periodo: TipoPeriodoDesignacion.SEMESTRE_2, docenteCorreo: 'jhenny.castillo@uajms.edu.bo' },
  { sigla: 'INF521', materiaNombre: 'AUDITORIA INFORMATICA', semestre: 10, grupo: 1, periodo: TipoPeriodoDesignacion.SEMESTRE_2, docenteCorreo: 'jhenny.castillo@uajms.edu.bo' },

  // Ronald Yeber Cruz Delgado
  { sigla: 'INF301', materiaNombre: 'TALLER I', semestre: 5, grupo: 1, periodo: TipoPeriodoDesignacion.ANUAL, docenteCorreo: 'ronald.cruz@uajms.edu.bo' },
  { sigla: 'INF501', materiaNombre: 'TALLER III', semestre: 9, grupo: 1, periodo: TipoPeriodoDesignacion.ANUAL, docenteCorreo: 'ronald.cruz@uajms.edu.bo' },

  // Jose Renzo Espinoza
  { sigla: 'INF401', materiaNombre: 'TALLER II', semestre: 7, grupo: 2, periodo: TipoPeriodoDesignacion.ANUAL, docenteCorreo: 'renzo.espinoza@uajms.edu.bo' },

  // Luis Robert Farfán Sivila
  { sigla: 'INF401', materiaNombre: 'TALLER II', semestre: 7, grupo: 1, periodo: TipoPeriodoDesignacion.ANUAL, docenteCorreo: 'roberth.farfan@uajms.edu.bo' },
  { sigla: 'INF501', materiaNombre: 'TALLER III', semestre: 9, grupo: 2, periodo: TipoPeriodoDesignacion.ANUAL, docenteCorreo: 'roberth.farfan@uajms.edu.bo' },
  { sigla: 'IEL421', materiaNombre: 'LABORATORIO DE SEGURIDAD EN REDES', semestre: 8, grupo: 1, periodo: TipoPeriodoDesignacion.SEMESTRE_2, docenteCorreo: 'roberth.farfan@uajms.edu.bo' },
  { sigla: 'MAT322', materiaNombre: 'INVESTIGACION OPERATIVA II', semestre: 6, grupo: 1, periodo: TipoPeriodoDesignacion.SEMESTRE_2, docenteCorreo: 'roberth.farfan@uajms.edu.bo' },

  // Juan Carlos Jaramillo Farfán
  { sigla: 'IEL321', materiaNombre: 'REDES II', semestre: 6, grupo: 1, periodo: TipoPeriodoDesignacion.SEMESTRE_2, docenteCorreo: 'juancarlos.jaramillo@uajms.edu.bo' },

  // Arturo Prudencio Nina
  { sigla: 'INF321', materiaNombre: 'BASE DE DATOS II', semestre: 6, grupo: 1, periodo: TipoPeriodoDesignacion.SEMESTRE_2, docenteCorreo: 'arturo.prudencio@uajms.edu.bo' },

  // Edwin Alberto Yevara Valdez
  { sigla: 'INF421', materiaNombre: 'INTELIGENCIA ARTIFICIAL', semestre: 8, grupo: 1, periodo: TipoPeriodoDesignacion.SEMESTRE_2, docenteCorreo: 'edwin.yevara@uajms.edu.bo' },
  { sigla: 'INF422', materiaNombre: 'INGENIERIA DE SOFTWARE II', semestre: 8, grupo: 1, periodo: TipoPeriodoDesignacion.SEMESTRE_2, docenteCorreo: 'edwin.yevara@uajms.edu.bo' }
];

export async function seedDesignaciones(prisma: PrismaClient, carreraInfoId: number) {
  console.log('📚 Cargando datos del módulo de Designaciones Docentes (Tariquía 2026)...');

  const plan = await prisma.planEstudio.findFirst({
    where: { carreraId: carreraInfoId, activo: true },
    orderBy: { id: 'desc' },
  });

  if (!plan) {
    throw new Error('No se encontró un plan de estudios activo para la carrera de Informática.');
  }

  const gestion = 2026;
  let exitosos = 0;

  for (const item of DESIGNACIONES_DATA) {
    const docente = await prisma.usuario.findUnique({
      where: { correo: item.docenteCorreo },
    });

    if (!docente) {
      console.warn(`⚠️ Docente no encontrado: ${item.docenteCorreo}. Omitiendo designación.`);
      continue;
    }

    // Asegurar existencia de la materia
    const materia = await prisma.materia.upsert({
      where: { codigo: item.sigla },
      update: {
        nombre: item.materiaNombre,
        semestre: item.semestre,
      },
      create: {
        codigo: item.sigla,
        nombre: item.materiaNombre,
        planId: plan.id,
        semestre: item.semestre,
        tipoPeriodo: item.periodo === TipoPeriodoDesignacion.ANUAL ? 'Anual' : 'Semestral',
      },
    });

    // Registrar o actualizar la designación académica
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
      update: {
        activo: true,
      },
      create: {
        docenteId: docente.id,
        materiaId: materia.id,
        grupo: item.grupo,
        gestion,
        periodo: item.periodo,
        activo: true,
      },
    });

    exitosos++;
  }

  console.log(`  └─ ✅ ${exitosos} designaciones académicas registradas exitosamente.\n`);
}
