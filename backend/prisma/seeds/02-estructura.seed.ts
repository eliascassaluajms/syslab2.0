import { PrismaClient } from '@prisma/client';

export async function seedEstructura(prisma: PrismaClient) {
  console.log('🏛️  Cargando datos del módulo de Estructura Institucional...');

  // =========================================================================
  // 1. FACULTADES
  // =========================================================================
  const facNaturales = await prisma.facultad.upsert({
    where: { sigla: 'FCIRNT' },
    update: {},
    create: {
      nombre: 'Facultad de Ciencias de la Ingeniería de Recursos Naturales y Tecnologías',
      sigla: 'FCIRNT'
    }
  });

  const facEmpresariales = await prisma.facultad.upsert({
    where: { sigla: 'FCE' },
    update: {},
    create: {
      nombre: 'Facultad de Ciencias Empresariales',
      sigla: 'FCE'
    }
  });

  console.log('  └─ ✅ Facultades (FCIRNT y FCE) procesadas.');

  // =========================================================================
  // 2. CARRERAS
  // =========================================================================
  const carrerasNaturales = [
    'Ingeniería Agronómica',
    'Ingeniería Informática',
    'Ingeniería Sanitaria y Ambiental',
    'Ingeniería de Recursos Hídricos'
  ];

  let carreraInfoId: number | null = null;
  for (const nombreCarrera of carrerasNaturales) {
    const carrera = await prisma.carrera.upsert({
      where: { nombre: nombreCarrera },
      update: { facultadId: facNaturales.id },
      create: { nombre: nombreCarrera, facultadId: facNaturales.id }
    });
    if (nombreCarrera === 'Ingeniería Informática') {
      carreraInfoId = carrera.id;
    }
  }

  const carrerasEmpresariales = [
    'Ingeniería Comercial',
    'Administración y Gestión Pública',
    'Contaduría Pública'
  ];

  for (const nombreCarrera of carrerasEmpresariales) {
    await prisma.carrera.upsert({
      where: { nombre: nombreCarrera },
      update: { facultadId: facEmpresariales.id },
      create: { nombre: nombreCarrera, facultadId: facEmpresariales.id }
    });
  }

  console.log('  └─ ✅ Carreras procesadas correctamente.');

  // =========================================================================
  // 3. LABORATORIOS
  // =========================================================================
  const carreraAmbientalId = (await prisma.carrera.findFirst({
    where: { nombre: 'Ingeniería Sanitaria y Ambiental' }
  }))?.id || carreraInfoId;

  const lab1 = await prisma.laboratorio.upsert({
    where: { codigo: 'LAB-1' },
    update: {},
    create: {
      codigo: 'LAB-1',
      nombre: 'Laboratorio 1 Ing Agronómica / Computación',
      ubicacion: 'Calle Jacinto Delfín, Campus Yacuiba',
      capacidad: 25,
      facultadId: facNaturales.id,
      carreraId: carreraInfoId
    }
  });

  const lab2 = await prisma.laboratorio.upsert({
    where: { codigo: 'LAB-2' },
    update: {},
    create: {
      codigo: 'LAB-2',
      nombre: 'Laboratorio 2 de Informática',
      ubicacion: 'Campus Universitario Yacuiba',
      capacidad: 20,
      facultadId: facNaturales.id,
      carreraId: carreraInfoId
    }
  });

  const lab3 = await prisma.laboratorio.upsert({
    where: { codigo: 'LAB-3' },
    update: {},
    create: {
      codigo: 'LAB-3',
      nombre: 'Laboratorio 3 de Informática',
      ubicacion: 'Campus Universitario Yacuiba',
      capacidad: 20,
      facultadId: facNaturales.id,
      carreraId: carreraInfoId
    }
  });

  const lab4 = await prisma.laboratorio.upsert({
    where: { codigo: 'LAB-4' },
    update: {},
    create: {
      codigo: 'LAB-4',
      nombre: 'Laboratorio 4 de Informática',
      ubicacion: 'Campus Universitario Yacuiba',
      capacidad: 20,
      facultadId: facNaturales.id,
      carreraId: carreraInfoId
    }
  });

  const lab5 = await prisma.laboratorio.upsert({
    where: { codigo: 'LAB-5' },
    update: {},
    create: {
      codigo: 'LAB-5',
      nombre: 'Laboratorio de Sanitaria y Ambiental',
      ubicacion: 'Campus Universitario Yacuiba',
      capacidad: 20,
      facultadId: facNaturales.id,
      carreraId: carreraAmbientalId
    }
  });

  const lab6 = await prisma.laboratorio.upsert({
    where: { codigo: 'LAB-6' },
    update: {},
    create: {
      codigo: 'LAB-6',
      nombre: 'Laboratorio / Oficinas Centrales',
      ubicacion: 'Campus Universitario Yacuiba',
      capacidad: 15,
      facultadId: facNaturales.id,
      carreraId: carreraInfoId
    }
  });

  const lab7 = await prisma.laboratorio.upsert({
    where: { codigo: 'LAB-7' },
    update: {},
    create: {
      codigo: 'LAB-7',
      nombre: 'Laboratorio Sede Caraparí',
      ubicacion: 'Sede Desconcentrada Caraparí',
      capacidad: 25,
      facultadId: facNaturales.id,
      carreraId: carreraInfoId
    }
  });

  console.log('  └─ ✅ 7 Laboratorios institucionales registrados.\n');

  return {
    carreraInfoId,
    facultadId: facNaturales.id,
    labs: { lab1, lab2, lab3, lab4, lab5, lab6, lab7 }
  };
}