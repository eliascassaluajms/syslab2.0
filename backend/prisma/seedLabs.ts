import { prisma } from '../src/config/prisma.js';

async function main() {
  console.log('🌱 [Docker Seed] Iniciando sincronización de laboratorios y permisos...');

  // 1. Crear o asegurar el permiso maestro (usando 'codigo' según schema.prisma)
  const permisoVerEstado = await prisma.permiso.upsert({
    where: { codigo: 'laboratorios:ver_estado' },
    update: {},
    create: {
      codigo: 'laboratorios:ver_estado',
      descripcion: 'Permite ver el estado en tiempo real de los laboratorios',
    },
  });
  console.log('✅ Permiso verificado:', permisoVerEstado.codigo);

  // 2. Asignar el permiso a los roles clave
  const rolesAAsignar = ['Administrador Global', 'Jefe de Laboratorios', 'Administrador']; 

  for (const nombreRol of rolesAAsignar) {
    const rol = await prisma.rol.findFirst({
      where: { nombre: { contains: nombreRol, mode: 'insensitive' } }
    });

    if (rol) {
      const existeRelacion = await prisma.rolPermiso.findFirst({
        where: {
          rolId: rol.id,
          permisoId: permisoVerEstado.id
        }
      });

      if (!existeRelacion) {
        await prisma.rolPermiso.create({
          data: {
            rolId: rol.id,
            permisoId: permisoVerEstado.id
          }
        });
        console.log(`🔗 Permiso asignado al rol: ${rol.nombre}`);
      }
    }
  }

  // 3. Limpiar los laboratorios actuales
  console.log('🧹 Limpiando registros anteriores de laboratorios...');
  await prisma.laboratorio.deleteMany({});
  console.log('🗑️ Tabla de laboratorios reseteada.');

  // 4. Obtener una facultad por defecto
  const facultadDefault = await prisma.facultad.findFirst();
  
  if (!facultadDefault) {
    console.error('❌ Error: No se encontró ninguna facultad en la base de datos.');
    return;
  }

  // 5. Generar los 8 laboratorios con 20 equipos de capacidad cada uno
  console.log('🏗️ Creando los 8 laboratorios iniciales (capacidad: 20 equipos)...');
  
  const laboratoriosData = Array.from({ length: 8 }, (_, index) => {
    const numero = index + 1;
    return {
      nombre: `Laboratorio de Computación ${numero}`,
      codigo: `LAB-0${numero}`,
      ubicacion: `Campus Universitario - Bloque Lab ${numero}`,
      capacidad: 20,
      descripcion: `Laboratorio inicial configurado automáticamente por seed para 20 equipos.`,
      activo: true,
      facultadId: facultadDefault.id,
      carreraId: null
    };
  });

  for (const lab of laboratoriosData) {
    await prisma.laboratorio.create({ data: lab });
    console.log(`✨ Creado: ${lab.nombre} (${lab.codigo})`);
  }

  console.log('🚀 ¡Seed de laboratorios ejecutado exitosamente en Docker!');
}

main()
  .catch((e) => {
    console.error('❌ Error crítico en el seed de laboratorios:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });