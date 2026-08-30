import { PrismaClient } from '@prisma/client';

export async function seedEventos(prisma: PrismaClient, carreraInfoId: number, usuarioId: number) {
  console.log('📅 Cargando datos del módulo de Categorías de Eventos y Actividades...');

  // =========================================================================
  // 1. CATEGORÍAS DE EVENTOS
  // =========================================================================
  const categoriasData = [
    { nombre: 'Congreso', descripcion: 'Congresos científicos y académicos de gran envergadura' },
    { nombre: 'Curso', descripcion: 'Cursos de capacitación y actualización tecnológica' },
    { nombre: 'Seminario', descripcion: 'Seminarios especializados y conferencias magistrales' },
    { nombre: 'Taller', descripcion: 'Talleres prácticos orientados al uso de laboratorios' }
  ];

  const categoriasMap: Record<string, any> = {};
  for (const cat of categoriasData) {
    const categoria = await (prisma as any).categoriaEvento.upsert({
      where: { nombre: cat.nombre },
      update: { descripcion: cat.descripcion },
      create: {
        nombre: cat.nombre,
        descripcion: cat.descripcion,
        carreraId: carreraInfoId
      }
    });
    categoriasMap[cat.nombre] = categoria;
  }

  console.log('  └─ ✅ Categorías de eventos registradas.');

  // =========================================================================
  // 2. ACTIVIDADES (CURSO DE DOCKER Y CONGRESO CITREN)
  // =========================================================================
  const actividadesData = [
    {
      titulo: 'Curso Práctico de Docker y Contenedores en Linux',
      descripcion: 'Capacitación intensiva sobre virtualización ligera, despliegue de microservicios y contenedores para laboratorios de informática.',
      categoria: 'Curso'
    },
    {
      titulo: 'CITREN 2026 - Congreso Internacional de Tecnologías de Redes y Ingeniería',
      descripcion: 'Congreso anual que reúne a investigadores, docentes y estudiantes para debatir avances en computación paralela, redes y tecnologías emergentes.',
      categoria: 'Congreso'
    }
  ];

  for (const act of actividadesData) {
    const catObj = categoriasMap[act.categoria];
    if (catObj) {
      await (prisma as any).actividad.upsert({
        where: { titulo: act.titulo },
        update: {
          descripcion: act.descripcion,
          categoriaEventoId: catObj.id
        },
        create: {
          titulo: act.titulo,
          descripcion: act.descripcion,
          categoriaEventoId: catObj.id,
          carreraId: carreraInfoId,
          creadoPorId: usuarioId,
          estado: 'PUBLICADO'
        }
      });
    }
  }

  console.log('  └─ ✅ Actividades institucionales (Curso de Docker y Congreso CITREN) cargadas con éxito.\n');
}
