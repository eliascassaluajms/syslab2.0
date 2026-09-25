import { prisma } from '../src/config/prisma.js';

async function main() {
  console.log('Iniciando la importación del Plan de Estudios 2009 de Ingeniería Sanitaria y Ambiental (ISA)...');

  // 1. Asegurar la Facultad FIRNT
  const facultad = await prisma.facultad.upsert({
    where: { sigla: 'FIRNT' },
    update: {},
    create: {
      nombre: 'Facultad de Ingeniería en Recursos Naturales y Tecnología',
      sigla: 'FIRNT',
      activo: true,
    },
  });

  // 2. Asegurar la Carrera de Ingeniería Sanitaria y Ambiental
  const carrera = await prisma.carrera.upsert({
    where: { nombre: 'Ingeniería Sanitaria y Ambiental' },
    update: {},
    create: {
      nombre: 'Ingeniería Sanitaria y Ambiental',
      descripcion: 'Carrera dependiente de la FIRNT - UAJMS',
      facultadId: facultad.id,
      activo: true,
    },
  });

  // 3. Crear o verificar el Plan de Estudios 2009
  let planEstudio = await prisma.planEstudio.findFirst({
    where: { carreraId: carrera.id, gestion: 2009 },
  });

  if (!planEstudio) {
    planEstudio = await prisma.planEstudio.create({
      data: {
        carreraId: carrera.id,
        gestion: 2009,
        descripcion: 'PLAN DE ESTUDIOS 2009',
        activo: true,
      },
    });
    console.log('Plan de Estudios 2009 creado exitosamente.');
  } else {
    console.log('El Plan de Estudios 2009 ya existe. Sincronizando asignaturas...');
  }

  // 4. Listado completo de materias organizadas por semestre
  const materiasData = [
    // PRIMER SEMESTRE
    { codigo: 'ISQ131', nombre: 'QUIMICA Y LABORATORIO', semestre: 1, tipoPeriodo: 'Semestral' },
    { codigo: 'ISM151', nombre: 'ALGEBRA LINEAL', semestre: 1, tipoPeriodo: 'Semestral' },
    { codigo: 'ISM111', nombre: 'MATEMATICAS I', semestre: 1, tipoPeriodo: 'Semestral' },
    { codigo: 'ISF121', nombre: 'FISICA I Y LABORATORIO', semestre: 1, tipoPeriodo: 'Semestral' },
    { codigo: 'ISE141', nombre: 'DISEÑO GRAFICO I', semestre: 1, tipoPeriodo: 'Semestral' },
    { codigo: 'ISM113', nombre: 'ELECTIVA I: INFORMATICA', semestre: 1, tipoPeriodo: 'Semestral' },

    // SEGUNDO SEMESTRE
    { codigo: 'ISM112', nombre: 'MATEMATICAS II', semestre: 2, tipoPeriodo: 'Semestral' },
    { codigo: 'ISF231', nombre: 'FISICA II Y LABORATORIO', semestre: 2, tipoPeriodo: 'Semestral' },
    { codigo: 'ISE251', nombre: 'DISEÑO GRAFICO II', semestre: 2, tipoPeriodo: 'Semestral' },
    { codigo: 'ISC192', nombre: 'MATERIALES DE CONSTRUCCION', semestre: 2, tipoPeriodo: 'Semestral' },
    { codigo: 'ISG182', nombre: 'GEOMETRIA DESCRIPTIVA', semestre: 2, tipoPeriodo: 'Semestral' },
    { codigo: 'ISA242', nombre: 'ELECTIVA II: ETICA PROFESIONAL', semestre: 2, tipoPeriodo: 'Semestral' },

    // TERCER SEMESTRE
    { codigo: 'ISQ321', nombre: 'QUIMICA ORGANICA', semestre: 3, tipoPeriodo: 'Semestral' },
    { codigo: 'ISA341', nombre: 'BIOLOGIA', semestre: 3, tipoPeriodo: 'Semestral' },
    { codigo: 'ISF331', nombre: 'FISICA III', semestre: 3, tipoPeriodo: 'Semestral' },
    { codigo: 'ISM311', nombre: 'MATEMATICAS III', semestre: 3, tipoPeriodo: 'Semestral' },
    { codigo: 'ISM312', nombre: 'ESTADISTICA Y PROBABILIDADES', semestre: 3, tipoPeriodo: 'Semestral' },
    { codigo: 'ISA442', nombre: 'ELECTIVA III: METODOLOGIA DE LA INVESTIGACION', semestre: 3, tipoPeriodo: 'Semestral' },

    // CUARTO SEMESTRE
    { codigo: 'ISQ421', nombre: 'QUIMICA SANITARIA', semestre: 4, tipoPeriodo: 'Semestral' },
    { codigo: 'ISQ422', nombre: 'LABORATORIO DE QUIMICA', semestre: 4, tipoPeriodo: 'Semestral' },
    { codigo: 'ISA441', nombre: 'ECOLOGIA', semestre: 4, tipoPeriodo: 'Semestral' },
    { codigo: 'ISH461', nombre: 'MECANICA DE FLUIDOS', semestre: 4, tipoPeriodo: 'Semestral' },
    { codigo: 'ISH462', nombre: 'CLIMATOLOGIA Y METEREOLOGIA', semestre: 4, tipoPeriodo: 'Semestral' },
    { codigo: 'ISM465', nombre: 'ELECTIVA IV: ADMINISTRACION DE RECURSOS HUMANOS', semestre: 4, tipoPeriodo: 'Semestral' },

    // QUINTO SEMESTRE
    { codigo: 'ISM511', nombre: 'TOPOGRAFIA', semestre: 5, tipoPeriodo: 'Semestral' },
    { codigo: 'ISE551', nombre: 'RESISTENCIA DE MATERIALES', semestre: 5, tipoPeriodo: 'Semestral' },
    { codigo: 'ISH561', nombre: 'HIDRAULICA Y LABORATORIO', semestre: 5, tipoPeriodo: 'Semestral' },
    { codigo: 'ISH562', nombre: 'HIDROLOGIA', semestre: 5, tipoPeriodo: 'Semestral' },
    { codigo: 'ISS571', nombre: 'MICROBIOLOGIA PARASITARIO Y LABORATORIO', semestre: 5, tipoPeriodo: 'Semestral' },
    { codigo: 'IST581', nombre: 'GEOLOGIA', semestre: 5, tipoPeriodo: 'Semestral' },

    // SEXTO SEMESTRE
    { codigo: 'ISQ621', nombre: 'PROCESO FISICO QUIMICOS DE TRATAMIENTO DE AGUA Y LABORATORIO', semestre: 6, tipoPeriodo: 'Semestral' },
    { codigo: 'ISA641', nombre: 'SANEAMIENTO AMBIENTAL', semestre: 6, tipoPeriodo: 'Semestral' },
    { codigo: 'ISE651', nombre: 'ANALISIS ESTRUCTURAL', semestre: 6, tipoPeriodo: 'Semestral' },
    { codigo: 'ISS671', nombre: 'SISTEMA DE ABASTECIMIENTO DE AGUA', semestre: 6, tipoPeriodo: 'Semestral' },
    { codigo: 'ISS672', nombre: 'SISTEMA DE ALCANTARILLADO', semestre: 6, tipoPeriodo: 'Semestral' },
    { codigo: 'ISA642', nombre: 'OPTATIVA I: CONSERVACION DE SUELO Y AGUA', semestre: 6, tipoPeriodo: 'Semestral' },

    // SEPTIMO SEMESTRE
    { codigo: 'ISM711', nombre: 'SISTEMAS DE INFORMACION GEOGRAFICO I', semestre: 7, tipoPeriodo: 'Semestral' },
    { codigo: 'ISE751', nombre: 'HORMIGON ARMADO', semestre: 7, tipoPeriodo: 'Semestral' },
    { codigo: 'ISS771', nombre: 'TRATAMIENTO DE AGUAS RESIDUALES', semestre: 7, tipoPeriodo: 'Semestral' },
    { codigo: 'ISS772', nombre: 'GESTION DE RESIDUOS SOLIDOS', semestre: 7, tipoPeriodo: 'Semestral' },
    { codigo: 'ISS773', nombre: 'PROCESOS BIOLOGICOS DE TRATAMIENTO DE AGUA Y LABORATORIO', semestre: 7, tipoPeriodo: 'Semestral' },
    { codigo: 'ISA741', nombre: 'OPTATIVA II: MODELACION AMBIENTAL', semestre: 7, tipoPeriodo: 'Semestral' },

    // OCTAVO SEMESTRE
    { codigo: 'ISM811', nombre: 'SISTEMAS DE INFORMACION GEOGRAFICO II', semestre: 8, tipoPeriodo: 'Semestral' },
    { codigo: 'ISM812', nombre: 'ESTRUCTURAS DE COSTOS', semestre: 8, tipoPeriodo: 'Semestral' },
    { codigo: 'ISA841', nombre: 'LEGISLACION SANITARIA Y AMBIENTAL', semestre: 8, tipoPeriodo: 'Semestral' },
    { codigo: 'ISS871', nombre: 'DISEÑO DE PLANTAS DE AGUAS POTABLES', semestre: 8, tipoPeriodo: 'Semestral' },
    { codigo: 'IST881', nombre: 'GEOTECNIA Y FUNDACIONES', semestre: 8, tipoPeriodo: 'Semestral' },
    { codigo: 'ISA842', nombre: 'OPTATIVA III: GESTION DE LOS RESIDUOS PELIGROSOS', semestre: 8, tipoPeriodo: 'Semestral' },

    // NOVENO SEMESTRE
    { codigo: 'ISE941', nombre: 'PREPARACION, EVALUACION Y ADMINISTRACION DE PROYECTOS SANITARIOS Y AMBIENTALES', semestre: 9, tipoPeriodo: 'Semestral' },
    { codigo: 'ISA942', nombre: 'EVALUACION DEL IMPACTO AMBIENTAL', semestre: 9, tipoPeriodo: 'Semestral' },
    { codigo: 'ISS971', nombre: 'DISEÑO DE PLANTAS DE AGUA RESIDUAL', semestre: 9, tipoPeriodo: 'Semestral' },
    { codigo: 'ISS972', nombre: 'INSTALACIONES SANITARIAS EN EDIFICIOS', semestre: 9, tipoPeriodo: 'Semestral' },
    { codigo: 'ISG991', nombre: 'ACTIVIDAD DE PROFESIONALIZACION I', semestre: 9, tipoPeriodo: 'Semestral' },
    { codigo: 'ISA943', nombre: 'OPTATIVA IV: GESTION DE LA CALIDAD AMBIENTAL', semestre: 9, tipoPeriodo: 'Semestral' },

    // DECIMO SEMESTRE
    { codigo: 'ISA042', nombre: 'GESTION DE PROYECTOS SANITARIOS Y AMBIENTALES', semestre: 10, tipoPeriodo: 'Semestral' },
    { codigo: 'ISA092', nombre: 'ACTIVIDAD DE PROFESIONALIZACION II', semestre: 10, tipoPeriodo: 'Semestral' },
  ];

  for (const m of materiasData) {
    await prisma.materia.upsert({
      where: { codigo: m.codigo },
      update: {
        nombre: m.nombre,
        semestre: m.semestre,
        planId: planEstudio.id,
        tipoPeriodo: m.tipoPeriodo,
      },
      create: {
        codigo: m.codigo,
        nombre: m.nombre,
        semestre: m.semestre,
        planId: planEstudio.id,
        tipoPeriodo: m.tipoPeriodo,
      },
    });
    console.log(`Materia sincronizada: [${m.codigo}] ${m.nombre} (Semestre ${m.semestre})`);
  }

  console.log('¡Importación completa y exitosa del Plan de Estudios 2009 de Ingeniería Sanitaria y Ambiental!');
}

main()
  .catch((e) => {
    console.error('Error durante la ejecución del script de importación:', e);
    process.exit(1);
  });