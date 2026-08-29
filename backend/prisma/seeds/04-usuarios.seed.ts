import { PrismaClient } from '@prisma/client';

interface SeedUsuariosParams {
  rolAdminId: number;
  rolJefeId: number;
  rolDocenteId: number;
  carreraInfoId: number;
  facultadId: number;
  labs: {
    lab1: { id: number };
    lab2: { id: number };
    lab3: { id: number };
    lab4: { id: number };
    lab5: { id: number };
    lab6: { id: number };
    lab7: { id: number };
  };
  passwordHash: string;
}

export async function seedUsuarios(prisma: PrismaClient, params: SeedUsuariosParams) {
  console.log('👥 Cargando datos del módulo de Usuarios, Docentes e Inventario de Equipos...');

  const { rolAdminId, rolJefeId, rolDocenteId, carreraInfoId, facultadId, labs, passwordHash } = params;

  // =========================================================================
  // 1. USUARIOS DEL SISTEMA
  // =========================================================================
  const userAdmin = await prisma.usuario.upsert({
    where: { correo: 'admin@uajms.edu.bo' },
    update: {},
    create: {
      nombre: 'Administrador',
      apellido: 'Sistema',
      correo: 'admin@uajms.edu.bo',
      password: passwordHash,
      rolId: rolAdminId,
      activo: true,
      esGlobal: true
    }
  });

  const userJefe = await prisma.usuario.upsert({
    where: { correo: 'jefe.labs@uajms.edu.bo' },
    update: {},
    create: {
      nombre: 'Elias',
      apellido: 'Cassal Baldiviezo',
      correo: 'jefe.labs@uajms.edu.bo',
      password: passwordHash,
      rolId: rolJefeId,
      activo: true,
      esGlobal: false
    }
  });

  // =========================================================================
  // 2. DOCENTES
  // =========================================================================
  const docentesData = [
    { nombre: 'Yovana', apellido: 'Sanchez', correo: 'yovana.sanchez@uajms.edu.bo' },
    { nombre: 'Cesar', apellido: 'Santos', correo: 'cesar.santos@uajms.edu.bo' },
    { nombre: 'Juan Carlos', apellido: 'Jaramillo', correo: 'juancarlos.jaramillo@uajms.edu.bo' },
    { nombre: 'Roberth', apellido: 'Farfán', correo: 'roberth.farfan@uajms.edu.bo' },
    { nombre: 'Renzo', apellido: 'Espinoza', correo: 'renzo.espinoza@uajms.edu.bo' },
    { nombre: 'Pedro', apellido: 'Arenas', correo: 'pedro.arenas@uajms.edu.bo' },
    { nombre: 'Ronald', apellido: 'Cruz', correo: 'ronald.cruz@uajms.edu.bo' },
    { nombre: 'Jhenny', apellido: 'Castillo', correo: 'jhenny.castillo@uajms.edu.bo' },
    { nombre: 'Jose Luis', apellido: 'Narvaez', correo: 'jose.narvaez@uajms.edu.bo' },
    { nombre: 'Guiver', apellido: 'Calderon', correo: 'guiver.calderon@uajms.edu.bo' },
    { nombre: 'Emilse', apellido: 'Aguirre', correo: 'emilse.aguirre@uajms.edu.bo' },
    { nombre: 'Silvia', apellido: 'Olivera', correo: 'silvia.olivera@uajms.edu.bo' },
    { nombre: 'Moises', apellido: 'Huanca', correo: 'moises.huanca@uajms.edu.bo' },
    { nombre: 'Nestor', apellido: 'Bernal', correo: 'nestor.bernal@uajms.edu.bo' },
    { nombre: 'Arturo', apellido: 'Prudencio', correo: 'arturo.prudencio@uajms.edu.bo' }
  ];

  const usuariosDocentes = [];
  for (const d of docentesData) {
    const user = await prisma.usuario.upsert({
      where: { correo: d.correo },
      update: {},
      create: {
        nombre: d.nombre,
        apellido: d.apellido,
        correo: d.correo,
        password: passwordHash,
        rolId: rolDocenteId,
        activo: true,
        esGlobal: false
      }
    });
    usuariosDocentes.push(user);
  }

  console.log(`  └─ ✅ ${usuariosDocentes.length} docentes y usuarios de sistema creados.`);

  // =========================================================================
  // 3. ASIGNACIONES DE ÁMBITO (RBAC) - LIMPIEZA Y RE-CREACIÓN LIMPIA
  // =========================================================================
  
  // Admin
  await prisma.asignacionAmbito.deleteMany({
    where: { usuarioId: userAdmin.id }
  });
  await prisma.asignacionAmbito.create({
    data: {
      usuarioId: userAdmin.id,
      rolId: rolAdminId,
      facultadId: null,
      carreraId: null
    }
  });

  // Jefe de Labs
  await prisma.asignacionAmbito.deleteMany({
    where: { usuarioId: userJefe.id }
  });
  await prisma.asignacionAmbito.create({
    data: {
      usuarioId: userJefe.id,
      rolId: rolJefeId,
      facultadId: facultadId,
      carreraId: carreraInfoId
    }
  });

  // Docentes
  for (const docente of usuariosDocentes) {
    await prisma.asignacionAmbito.deleteMany({
      where: { usuarioId: docente.id }
    });
    await prisma.asignacionAmbito.create({
      data: {
        usuarioId: docente.id,
        rolId: rolDocenteId,
        facultadId: facultadId,
        carreraId: carreraInfoId
      }
    });
  }

  console.log('  └─ ✅ Asignaciones de ámbito creadas para todos los usuarios.');

  // =========================================================================
  // 4. INVENTARIO DE EQUIPOS DE LABORATORIO
  // =========================================================================
  const configuracionLaboratorios = [
    { labId: labs.lab1.id, prefijo: 'LAB1', cantidad: 20 },
    { labId: labs.lab2.id, prefijo: 'LAB2', cantidad: 15 },
    { labId: labs.lab3.id, prefijo: 'LAB3', cantidad: 18 },
    { labId: labs.lab4.id, prefijo: 'LAB4', cantidad: 18 },
    { labId: labs.lab5.id, prefijo: 'LAB5', cantidad: 12 },
    { labId: labs.lab6.id, prefijo: 'LAB6', cantidad: 10 },
    { labId: labs.lab7.id, prefijo: 'LAB7', cantidad: 20 }
  ];

  let totalEquipos = 0;

  for (const conf of configuracionLaboratorios) {
    for (let i = 1; i <= conf.cantidad; i++) {
      const numFormatted = i.toString().padStart(2, '0');
      const codigoInventario = `EQ-${conf.prefijo}-${numFormatted}`;

      await prisma.equipo.upsert({
        where: { codigoInventario: codigoInventario },
        update: { laboratorioId: conf.labId },
        create: {
          codigoInventario: codigoInventario,
          nombre: `Estación de Trabajo ${conf.prefijo}-${numFormatted}`,
          marca: i % 2 === 0 ? 'Dell' : 'HP',
          modelo: i % 2 === 0 ? 'OptiPlex 7090' : 'ProDesk 400 G6',
          numSerie: `SN-${conf.prefijo}-${numFormatted}-2026`,
          estado: 'OPERATIVO',
          especificaciones: {
            procesador: i % 2 === 0 ? 'Intel Core i7-10700' : 'Intel Core i5-10500',
            ram: '16 GB DDR4',
            almacenamiento: '512 GB SSD NVMe',
            os: 'Windows 11 Pro / Ubuntu 22.04 LTS'
          },
          laboratorioId: conf.labId
        }
      });
      totalEquipos++;
    }
  }

  console.log(`  └─ ✅ ${totalEquipos} equipos de computación registrados e inventariados.\n`);

  return {
    userAdmin,
    userJefe,
    usuariosDocentes
  };
}
