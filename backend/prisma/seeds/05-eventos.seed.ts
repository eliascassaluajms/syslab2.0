import { PrismaClient } from '@prisma/client';

export async function seedEventos(prisma: PrismaClient, carreraInfoId: number, adminUserId: number) {
  console.log('\n📅 Cargando datos del módulo de Categorías de Eventos y Actividades...');

  const categoriasData = [
    { nombre: 'Congreso', descripcion: 'Congresos científicos y académicos de gran envergadura' },
    { nombre: 'Seminario', descripcion: 'Seminarios y charlas magistrales' },
    { nombre: 'Taller', descripcion: 'Talleres prácticos y capacitaciones' },
    { nombre: 'Curso', descripcion: 'Cursos de corta y media duración' },
    { nombre: 'Simposio', descripcion: 'Simposios y mesas redondas de debate' }
  ];

  const categoriasMap: Record<string, any> = {};

  for (const cat of categoriasData) {
    let categoria = await (prisma as any).categoriaEvento.findFirst({
      where: {
        nombre: cat.nombre,
        carreraId: carreraInfoId
      }
    });

    if (!categoria) {
      categoria = await (prisma as any).categoriaEvento.create({
        data: {
          nombre: cat.nombre,
          descripcion: cat.descripcion,
          carreraId: carreraInfoId
        }
      });
    } else {
      categoria = await (prisma as any).categoriaEvento.update({
        where: { id: categoria.id },
        data: { descripcion: cat.descripcion }
      });
    }

    categoriasMap[cat.nombre] = categoria;
  }

  console.log(`  └─ ✅ ${Object.keys(categoriasMap).length} Categorías de eventos procesadas.`);

  // 2. ACTIVIDADES Y EVENTOS[cite: 14]
  const labBase = await prisma.laboratorio.findFirst();
  const labId = labBase ? labBase.id : 1;

  const actividadesData = [
    {
      title: 'Curso Práctico de Docker y Contenedores en Linux',
      description: 'Capacitación intensiva sobre virtualización ligera, despliegue de microservicios y contenedores para laboratorios de informática.',
      bannerUrl: '/media/imagenes/docker-curso.jpeg'
    },
    {
      title: 'CITREN 2026 - Congreso Internacional de Tecnologías de Redes y Ingeniería',
      description: 'Congreso anual que reúne a investigadores, docentes y estudiantes para debatir avances en computación paralela, redes y tecnologías emergentes.',
      bannerUrl: '/media/imagenes/CITREN-logo.jpeg'
    }
  ];

  for (const act of actividadesData) {
    let actividad = await (prisma as any).activity.findFirst({
      where: { title: act.title }
    });

    if (!actividad) {
      await (prisma as any).activity.create({
        data: {
          title: act.title,
          description: act.description,
          careerScope: carreraInfoId.toString(),
          labId: labId,
          bannerUrl: act.bannerUrl
        }
      });
    } else {
      await (prisma as any).activity.update({
        where: { id: actividad.id },
        data: {
          description: act.description,
          careerScope: carreraInfoId.toString(),
          bannerUrl: act.bannerUrl
        }
      });
    }
  }

  console.log('  └─ ✅ Actividades institucionales cargadas con éxito[cite: 14].\n');
}