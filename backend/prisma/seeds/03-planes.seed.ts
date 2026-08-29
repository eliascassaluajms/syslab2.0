import { PrismaClient } from '@prisma/client';

export async function seedPlanes(prisma: PrismaClient, carreraInfoId: number) {
  console.log('📚 Cargando datos del módulo de Planes de Estudio y Materias...');

  // =========================================================================
  // 1. PLAN DE ESTUDIOS 2007
  // =========================================================================
  let planInformatica2007 = await (prisma as any).planEstudio.findFirst({
    where: { carreraId: carreraInfoId, gestion: 2007 }
  });

  if (!planInformatica2007) {
    planInformatica2007 = await (prisma as any).planEstudio.create({
      data: {
        carreraId: carreraInfoId,
        gestion: 2007,
        descripcion: 'Plan de Estudios 2007 - Ingeniería Informática'
      }
    });
  } else {
    planInformatica2007 = await (prisma as any).planEstudio.update({
      where: { id: planInformatica2007.id },
      data: { descripcion: 'Plan de Estudios 2007 - Ingeniería Informática' }
    });
  }

  const materiasPlan2007 = [
    { codigo: 'MAT111', nombre: 'CALCULO I', semestre: 1, tipoPeriodo: 'Semestral' },
    { codigo: 'MAT112', nombre: 'ALGEBRA LINEAL', semestre: 1, tipoPeriodo: 'Semestral' },
    { codigo: 'INF111', nombre: 'PROGRAMACION I', semestre: 1, tipoPeriodo: 'Semestral' },
    { codigo: 'INF112', nombre: 'FUND. DE LA INFORMATICA', semestre: 1, tipoPeriodo: 'Semestral' },
    { codigo: 'LIN111', nombre: 'INGLES I', semestre: 1, tipoPeriodo: 'Semestral' },
    { codigo: 'AUD111', nombre: 'SISTEMAS CONTABLES', semestre: 1, tipoPeriodo: 'Semestral' },
    { codigo: 'MAT121', nombre: 'CALCULO II', semestre: 2, tipoPeriodo: 'Semestral' },
    { codigo: 'FIS111', nombre: 'FISICA I', semestre: 2, tipoPeriodo: 'Semestral' },
    { codigo: 'INF121', nombre: 'PROGRAMACION II', semestre: 2, tipoPeriodo: 'Semestral' },
    { codigo: 'INF122', nombre: 'INTROD. A LOS SISTEMAS OPERATIVOS', semestre: 2, tipoPeriodo: 'Semestral' },
    { codigo: 'MAT122', nombre: 'ESTADISTICA DESCRIPTIVA', semestre: 2, tipoPeriodo: 'Semestral' },
    { codigo: 'LIN121', nombre: 'INGLES II', semestre: 2, tipoPeriodo: 'Semestral' },
    { codigo: 'MAT211', nombre: 'CALCULO III', semestre: 3, tipoPeriodo: 'Semestral' },
    { codigo: 'FIS211', nombre: 'FISICA II', semestre: 3, tipoPeriodo: 'Semestral' },
    { codigo: 'INF211', nombre: 'PROGRAMACION III', semestre: 3, tipoPeriodo: 'Semestral' },
    { codigo: 'INF212', nombre: 'TEORIA DE AUTOMATAS Y LENGUAJES FORMALES', semestre: 3, tipoPeriodo: 'Semestral' },
    { codigo: 'MAT212', nombre: 'TEORIA DE PROBABILIDADES', semestre: 3, tipoPeriodo: 'Semestral' },
    { codigo: 'MAT213', nombre: 'COMBINATORIA Y TEORIA DE GRAFOS', semestre: 3, tipoPeriodo: 'Semestral' },
    { codigo: 'ELT121', nombre: 'LIDERAZGO EMPRESARIAL', semestre: 3, tipoPeriodo: 'Semestral' },
    { codigo: 'MAT221', nombre: 'CALCULO IV', semestre: 4, tipoPeriodo: 'Semestral' },
    { codigo: 'IEL221', nombre: 'TEORIA DE LA COMUNICACION Y SEÑALES', semestre: 4, tipoPeriodo: 'Semestral' },
    { codigo: 'MAT222', nombre: 'ANALISIS NUMERICO', semestre: 4, tipoPeriodo: 'Semestral' },
    { codigo: 'ADM221', nombre: 'ADMINISTRACION DE LAS ORGANIZACIONES', semestre: 4, tipoPeriodo: 'Semestral' },
    { codigo: 'IEL222', nombre: 'ARQUITECTURA DE COMPUTADORES', semestre: 4, tipoPeriodo: 'Semestral' },
    { codigo: 'INF221', nombre: 'PROGRAMACION IV', semestre: 4, tipoPeriodo: 'Semestral' },
    { codigo: 'ELT122', nombre: 'METODOLOGIA DE LA INVESTIGACION', semestre: 4, tipoPeriodo: 'Semestral' },
    { codigo: 'INF311', nombre: 'BASE DE DATOS I', semestre: 5, tipoPeriodo: 'Semestral' },
    { codigo: 'INF312', nombre: 'ANALISIS DE SISTEMAS I', semestre: 5, tipoPeriodo: 'Semestral' },
    { codigo: 'MAT311', nombre: 'INVESTIGACION OPERATIVA I', semestre: 5, tipoPeriodo: 'Semestral' },
    { codigo: 'IEL311', nombre: 'REDES I', semestre: 5, tipoPeriodo: 'Semestral' },
    { codigo: 'ECO311', nombre: 'ECONOMIA GENERAL', semestre: 5, tipoPeriodo: 'Semestral' },
    { codigo: 'INF301', nombre: 'TALLER I', semestre: 5, tipoPeriodo: 'Anual' },
    { codigo: 'ECO321', nombre: 'PREPARACION Y EVALUAC. DE PROYECTOS', semestre: 6, tipoPeriodo: 'Semestral' },
    { codigo: 'IEL321', nombre: 'REDES II', semestre: 6, tipoPeriodo: 'Semestral' },
    { codigo: 'INF321', nombre: 'BASE DE DATOS II', semestre: 6, tipoPeriodo: 'Semestral' },
    { codigo: 'INF322', nombre: 'ANALISIS DE SISTEMAS II', semestre: 6, tipoPeriodo: 'Semestral' },
    { codigo: 'MAT322', nombre: 'INVESTIGACION OPERATIVA II', semestre: 6, tipoPeriodo: 'Semestral' },
    { codigo: 'IEL411', nombre: 'REDES III', semestre: 7, tipoPeriodo: 'Semestral' },
    { codigo: 'INF411', nombre: 'BASES DE DATOS III', semestre: 7, tipoPeriodo: 'Semestral' },
    { codigo: 'INF412', nombre: 'INGENIERIA DE SOFTWARE I', semestre: 7, tipoPeriodo: 'Semestral' },
    { codigo: 'INF413', nombre: 'TECNOLOGIA MULTIMEDIA', semestre: 7, tipoPeriodo: 'Semestral' },
    { codigo: 'INF401', nombre: 'TALLER II', semestre: 7, tipoPeriodo: 'Anual' },
    { codigo: 'INF414', nombre: 'OPTATIVA I', semestre: 7, tipoPeriodo: 'Semestral' },
    { codigo: 'TEL410', nombre: 'LABORATORIO DE GESTION DE REDES', semestre: 7, tipoPeriodo: 'Semestral' },
    { codigo: 'WEM410', nombre: 'DESARROLLO WEB Y MULTIMEDIA', semestre: 7, tipoPeriodo: 'Semestral' },
    { codigo: 'INF421', nombre: 'INTELIGENCIA ARTIFICIAL', semestre: 8, tipoPeriodo: 'Semestral' },
    { codigo: 'INF422', nombre: 'INGENIERIA DE SOFTWARE II', semestre: 8, tipoPeriodo: 'Semestral' },
    { codigo: 'INF423', nombre: 'TECNOLOGIA DE PROGRAMACION EN RED', semestre: 8, tipoPeriodo: 'Semestral' },
    { codigo: 'IEL421', nombre: 'LABORATORIO DE SEGURIDAD EN REDES', semestre: 8, tipoPeriodo: 'Semestral' },
    { codigo: 'INF424', nombre: 'OPTATIVA II', semestre: 8, tipoPeriodo: 'Semestral' },
    { codigo: 'TEL420', nombre: 'SISTEMAS PARALELOS', semestre: 8, tipoPeriodo: 'Semestral' },
    { codigo: 'WEM420', nombre: 'PLANEACION ESTRATEGICA Y DISEÑO DE SITIOS WEB', semestre: 8, tipoPeriodo: 'Semestral' },
    { codigo: 'INF511', nombre: 'ROBOTICA', semestre: 9, tipoPeriodo: 'Semestral' },
    { codigo: 'IEL511', nombre: 'TRANSMISION DE VOZ Y VIDEO', semestre: 9, tipoPeriodo: 'Semestral' },
    { codigo: 'DER511', nombre: 'LEGISLACION', semestre: 9, tipoPeriodo: 'Semestral' },
    { codigo: 'INF501', nombre: 'TALLER III', semestre: 9, tipoPeriodo: 'Anual' },
    { codigo: 'OPT510', nombre: 'OPTATIVA III', semestre: 9, tipoPeriodo: 'Semestral' },
    { codigo: 'WEN510', nombre: 'HERRAMIENTAS DE DISEÑO GRAFICO', semestre: 9, tipoPeriodo: 'Semestral' },
    { codigo: 'TEL510', nombre: 'LABORATORIO DE REDES INALAMBRICAS', semestre: 9, tipoPeriodo: 'Semestral' },
    { codigo: 'INF521', nombre: 'AUDITORIA INFORMATICA', semestre: 10, tipoPeriodo: 'Semestral' },
    { codigo: 'OPT520', nombre: 'OPTATIVA IV', semestre: 10, tipoPeriodo: 'Semestral' },
    { codigo: 'TEL520', nombre: 'TECNOLOGIAS MOVILES', semestre: 10, tipoPeriodo: 'Semestral' },
    { codigo: 'WEM520', nombre: 'COMERCIO ELECTRONICO', semestre: 10, tipoPeriodo: 'Semestral' }
  ];

  for (const mat of materiasPlan2007) {
    await (prisma as any).materia.upsert({
      where: { codigo: mat.codigo },
      update: { planId: planInformatica2007.id },
      create: {
        codigo: mat.codigo,
        nombre: mat.nombre,
        semestre: mat.semestre,
        tipoPeriodo: mat.tipoPeriodo,
        planId: planInformatica2007.id
      }
    });
  }

  console.log('  └─ ✅ Plan de Estudios 2007 cargado con sus materias.');

  // =========================================================================
  // 2. NUEVA MALLA CURRICULAR (2024)
  // =========================================================================
  let planInformaticaNuevaMalla = await (prisma as any).planEstudio.findFirst({
    where: { carreraId: carreraInfoId, gestion: 2024 }
  });

  if (!planInformaticaNuevaMalla) {
    planInformaticaNuevaMalla = await (prisma as any).planEstudio.create({
      data: {
        carreraId: carreraInfoId,
        gestion: 2024,
        descripcion: 'Malla Curricular Nueva - Ingeniería Informática'
      }
    });
  } else {
    planInformaticaNuevaMalla = await (prisma as any).planEstudio.update({
      where: { id: planInformaticaNuevaMalla.id },
      data: { descripcion: 'Malla Curricular Nueva - Ingeniería Informática' }
    });
  }

  const materiasNuevaMalla = [
    { codigo: 'NINF-101', nombre: 'Programación I', semestre: 1 },
    { codigo: 'NINF-102', nombre: 'Algebra', semestre: 1 },
    { codigo: 'NINF-103', nombre: 'Arquitectura de Computadores I', semestre: 1 },
    { codigo: 'NINF-104', nombre: 'Física I', semestre: 1 },
    { codigo: 'NINF-105', nombre: 'Calculo I', semestre: 1 },
    { codigo: 'NINF-106', nombre: 'Probabilidad y Estadísticas', semestre: 1 },
    { codigo: 'NINF-201', nombre: 'Programación II', semestre: 2 },
    { codigo: 'NINF-202', nombre: 'Arquitectura de Computadores II', semestre: 2 },
    { codigo: 'NINF-203', nombre: 'Administración de Sistemas Operativos', semestre: 2 },
    { codigo: 'NINF-204', nombre: 'Física II', semestre: 2 },
    { codigo: 'NINF-205', nombre: 'Calculo II', semestre: 2 },
    { codigo: 'NINF-206', nombre: 'Metodología de Investigación en Informática Aplicada', semestre: 2 },
    { codigo: 'NINF-301', nombre: 'Programación III', semestre: 3 },
    { codigo: 'NINF-302', nombre: 'Teoría de Autómatas y Lenguajes Formales', semestre: 3 },
    { codigo: 'NINF-303', nombre: 'Modelación Y Simulación en Ingeniería Informática', semestre: 3 },
    { codigo: 'NINF-304', nombre: 'Estructuras de Datos Complejas', semestre: 3 },
    { codigo: 'NINF-305', nombre: 'Calculo III', semestre: 3 },
    { codigo: 'NINF-306', nombre: 'Fundamentos de los Sistemas de Información Geográfica', semestre: 3 },
    { codigo: 'NINF-401', nombre: 'Programación IV', semestre: 4 },
    { codigo: 'NINF-402', nombre: 'Redes I', semestre: 4 },
    { codigo: 'NINF-403', nombre: 'Base de Datos I', semestre: 4 },
    { codigo: 'NINF-404', nombre: 'Análisis de Sistemas I', semestre: 4 },
    { codigo: 'NINF-405', nombre: 'Análisis Numérico', semestre: 4 },
    { codigo: 'NINF-406', nombre: 'Internet De Las Cosas', semestre: 4 },
    { codigo: 'NINF-501', nombre: 'Taller I', semestre: 5 },
    { codigo: 'NINF-502', nombre: 'Redes II', semestre: 5 },
    { codigo: 'NINF-503', nombre: 'Base de Datos II', semestre: 5 },
    { codigo: 'NINF-504', nombre: 'Análisis de Sistemas II', semestre: 5 },
    { codigo: 'NINF-505', nombre: 'Robótica', semestre: 5 },
    { codigo: 'NINF-506', nombre: 'Optativa I', semestre: 5 },
    { codigo: 'NINF-601', nombre: 'Taller II', semestre: 6 },
    { codigo: 'NINF-602', nombre: 'Redes III', semestre: 6 },
    { codigo: 'NINF-603', nombre: 'Base de Datos III', semestre: 6 },
    { codigo: 'NINF-604', nombre: 'Ingeniería de Software I', semestre: 6 },
    { codigo: 'NINF-605', nombre: 'Preparación y Evaluación de Proyectos', semestre: 6 },
    { codigo: 'NINF-606', nombre: 'Optativa II', semestre: 6 },
    { codigo: 'NINF-701', nombre: 'Minería de Datos', semestre: 7 },
    { codigo: 'NINF-702', nombre: 'Tecnologías Emergentes I', semestre: 7 },
    { codigo: 'NINF-703', nombre: 'Programación Grafica', semestre: 7 },
    { codigo: 'NINF-704', nombre: 'Ingeniería de Software II', semestre: 7 },
    { codigo: 'NINF-705', nombre: 'Electiva I', semestre: 7 },
    { codigo: 'NINF-706', nombre: 'Optativa III', semestre: 7 },
    { codigo: 'NINF-801', nombre: 'Trabajo de Grado I', semestre: 8 },
    { codigo: 'NINF-802', nombre: 'Tecnologías Emergentes II', semestre: 8 },
    { codigo: 'NINF-803', nombre: 'Inteligencia Artificial', semestre: 8 },
    { codigo: 'NINF-804', nombre: 'Auditoria Informática', semestre: 8 },
    { codigo: 'NINF-805', nombre: 'Electiva II', semestre: 8 },
    { codigo: 'NINF-806', nombre: 'Optativa IV', semestre: 8 },
    { codigo: 'NINF-901', nombre: 'Trabajo de Grado II', semestre: 9 }
  ];

  for (const mat of materiasNuevaMalla) {
    await (prisma as any).materia.upsert({
      where: { codigo: mat.codigo },
      update: { planId: planInformaticaNuevaMalla.id },
      create: {
        codigo: mat.codigo,
        nombre: mat.nombre,
        semestre: mat.semestre,
        tipoPeriodo: 'Semestral',
        planId: planInformaticaNuevaMalla.id
      }
    });
  }

  console.log('  └─ ✅ Nueva Malla Curricular (2024) cargada con sus materias.\n');
}