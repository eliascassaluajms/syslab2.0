import test from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('postgres-db:5432')) {
  process.env.DATABASE_URL = 'postgresql://admin_syslab:SecretPassword2026@127.0.0.1:5434/syslab_db?schema=public';
}

process.env.JWT_SECRET = process.env.JWT_SECRET || 'syslab_secreto_super_seguro_uajms';

import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

const appModule = await import('../src/app.js');
const prismaModule = await import('../src/config/prisma.js');
const app = appModule.default;
const prisma = prismaModule.prisma;

const secret = process.env.JWT_SECRET as string;
const sufijo = `${Date.now()}`;
const ANYO = new Date().getFullYear();

let server: ReturnType<typeof app.listen>;
let baseUrl: string;

interface Fixtures {
  adminId: number;
  estudianteId: number;
  docenteId: number;
  facultadId: number;
  laboratorioId: number;
  equipoId: number;
  materiaId: number;
  planId: number;
  carreraId: number;
  sesionId: number;
  deviceToken: string;
}

const fixtureIds: { usoIds: number[]; desafioIds: number[] } = { usoIds: [], desafioIds: [] };

test.before(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
      resolve();
    });
  });
});

test.after(async () => {
  if (server) {
    await new Promise<void>((resolve) => server.close(resolve));
  }
  await prisma.$disconnect();
});

async function crearFixtures(): Promise<Fixtures> {
  const hash = bcryptjs.hashSync('ClaveTest2026*', 10);

  const admin = await prisma.usuario.create({
    data: {
      nombre: 'Admin',
      apellido: 'LockTest',
      username: `admin_lock_${sufijo}`,
      correo: `admin_lock_${sufijo}@uajms.edu.bo`,
      password: hash,
      activo: true,
    },
  });

  const estudiante = await prisma.usuario.create({
    data: {
      nombre: 'Estudiante',
      apellido: 'LockTest',
      username: `${sufijo}`,
      correo: `estudiante_lock_${sufijo}@uajms.edu.bo`,
      password: hash,
      activo: true,
    },
  });

  const docente = await prisma.usuario.create({
    data: {
      nombre: 'Docente',
      apellido: 'LockTest',
      username: `docente_lock_${sufijo}`,
      correo: `docente_lock_${sufijo}@uajms.edu.bo`,
      password: hash,
      activo: true,
    },
  });

  const facultad = await prisma.facultad.create({
    data: { nombre: `Facultad Lock ${sufijo}`, sigla: `FL${sufijo.slice(-4)}` },
  });

  const carrera = await prisma.carrera.create({
    data: { nombre: `Carrera Lock ${sufijo}`, facultadId: facultad.id },
  });

  const plan = await prisma.planEstudio.create({
    data: { carreraId: carrera.id, gestion: ANYO, descripcion: `Plan Lock ${sufijo}` },
  });

  const materia = await prisma.materia.create({
    data: { codigo: `MAT${sufijo.slice(-6)}`, nombre: `Materia Lock ${sufijo}`, planId: plan.id, semestre: 1 },
  });

  const laboratorio = await prisma.laboratorio.create({
    data: { codigo: `LB${sufijo.slice(-6)}`, nombre: `Lab Lock ${sufijo}`, facultadId: facultad.id },
  });

  const equipo = await prisma.equipo.create({
    data: { codigoPatrimonial: `EQ-${sufijo}`, nombre: `PC Lock ${sufijo}`, laboratorioId: laboratorio.id },
  });

  const sesion = await prisma.sesionBitacora.create({
    data: {
      laboratorioId: laboratorio.id,
      materiaId: materia.id,
      fecha: new Date(),
      horaInicio: new Date().toTimeString().slice(0, 5),
      horaFin: '',
      practicaRealizada: null,
      cumplio: false,
      grupo: 1,
      semestre: 1,
      gestion: ANYO,
      tokenQR: `token-${sufijo}`,
    },
  });

  await prisma.inscripcionMateria.create({
    data: {
      estudianteId: estudiante.id,
      materiaId: materia.id,
      grupo: 1,
      semestre: 1,
      gestion: ANYO,
      estado: 'ACTIVA',
    },
  });

  await prisma.horario.create({
    data: {
      laboratorioId: laboratorio.id,
      materiaId: materia.id,
      docenteId: docente.id,
      diaSemana: 'Lunes',
      horaInicio: '08:00',
      horaFin: '09:30',
      grupo: 1,
      totalGrupos: 1,
      semestre: 1,
      gestion: ANYO,
    },
  });

  return {
    adminId: admin.id,
    estudianteId: estudiante.id,
    docenteId: docente.id,
    facultadId: facultad.id,
    carreraId: carrera.id,
    planId: plan.id,
    materiaId: materia.id,
    laboratorioId: laboratorio.id,
    equipoId: equipo.id,
    sesionId: sesion.id,
    deviceToken: '',
  };
}

async function limpiarFixtures(f: Fixtures) {
  const { usoIds, desafioIds } = fixtureIds;
  if (f.laboratorioId) {
    if (usoIds.length > 0) {
      await prisma.usoEquipo.deleteMany({ where: { id: { in: usoIds } } }).catch(() => undefined);
    }
    if (desafioIds.length > 0) {
      await prisma.desafioDesbloqueo.deleteMany({ where: { id: { in: desafioIds } } }).catch(() => undefined);
    }
    await prisma.dispositivoEscritorio.deleteMany({ where: { laboratorioId: f.laboratorioId } }).catch(() => undefined);
    await prisma.asistenciaEstudiante.deleteMany({ where: { sesionBitacoraId: f.sesionId } }).catch(() => undefined);
    await prisma.horario.deleteMany({ where: { laboratorioId: f.laboratorioId } }).catch(() => undefined);
    await prisma.sesionBitacora.deleteMany({ where: { id: f.sesionId } }).catch(() => undefined);
    await prisma.laboratorio.deleteMany({ where: { id: f.laboratorioId } }).catch(() => undefined);
  }
  if (f.materiaId) {
    await prisma.inscripcionMateria.deleteMany({ where: { materiaId: f.materiaId } }).catch(() => undefined);
    await prisma.materia.deleteMany({ where: { id: f.materiaId } }).catch(() => undefined);
  }
  if (f.planId) {
    await prisma.planEstudio.deleteMany({ where: { id: f.planId } }).catch(() => undefined);
  }
  if (f.carreraId) {
    await prisma.carrera.deleteMany({ where: { id: f.carreraId } }).catch(() => undefined);
  }
  if (f.facultadId) {
    await prisma.facultad.deleteMany({ where: { id: f.facultadId } }).catch(() => undefined);
  }
  const usuarios = [f.adminId, f.estudianteId, f.docenteId].filter((id) => id);
  if (usuarios.length > 0) {
    await prisma.usuario.deleteMany({ where: { id: { in: usuarios } } }).catch(() => undefined);
  }
}

test('Módulo de Desbloqueo de Equipos (desktop) - flujo completo', async (t) => {
  const f = await crearFixtures();

  const tokenAdmin = jwt.sign(
    { id: f.adminId, correo: `admin_lock_${sufijo}@uajms.edu.bo`, roles: ['Administrador'], permisos: ['equipos:crear'], esGlobal: true },
    secret,
    { expiresIn: '1h' }
  );

  const tokenEstudiante = jwt.sign(
    { id: f.estudianteId, correo: `estudiante_lock_${sufijo}@uajms.edu.bo`, roles: ['Estudiante'], permisos: ['horarios:listar', 'bitacora:consultar'] },
    secret,
    { expiresIn: '1h' }
  );

  const tokenDocente = jwt.sign(
    { id: f.docenteId, correo: `docente_lock_${sufijo}@uajms.edu.bo`, roles: ['Docente'], permisos: ['horarios:listar'] },
    secret,
    { expiresIn: '1h' }
  );

  try {
    await t.test('Login acepta el Registro Universitario (ru)', async () => {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ru: `${sufijo}`, password: 'ClaveTest2026*' }),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.ok(body.token);
      assert.equal(body.data.usuario.username, `${sufijo}`);
    });

    await t.test('GET /api/horarios/mi-horario lista el horario del docente', async () => {
      const res = await fetch(`${baseUrl}/api/horarios/mi-horario`, {
        headers: { Authorization: `Bearer ${tokenDocente}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.results, 1);
      assert.equal(body.data.horarios[0].materia.nombre, `Materia Lock ${sufijo}`);
    });

    await t.test('GET /api/horarios/mi-horario lista el horario del estudiante por inscripción', async () => {
      const res = await fetch(`${baseUrl}/api/horarios/mi-horario`, {
        headers: { Authorization: `Bearer ${tokenEstudiante}` },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.results, 1);
      assert.equal(body.data.horarios[0].materia.nombre, `Materia Lock ${sufijo}`);
    });

    await t.test('POST /api/desktop/registrar vincula el dispositivo al equipo', async () => {
      const res = await fetch(`${baseUrl}/api/desktop/registrar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenAdmin}` },
        body: JSON.stringify({ codigoPatrimonial: `EQ-${sufijo}`, laboratorioId: f.laboratorioId, nombreEquipo: 'PC-TEST-01' }),
      });
      assert.equal(res.status, 201);
      const body = await res.json();
      assert.ok(body.data.deviceToken);
      assert.equal(body.data.equipo.codigoPatrimonial, `EQ-${sufijo}`);
      f.deviceToken = body.data.deviceToken;
    });

    await t.test('POST /api/desktop/bloquear genera un código de 2 dígitos', async () => {
      const res = await fetch(`${baseUrl}/api/desktop/bloquear`, {
        method: 'POST',
        headers: { 'x-device-token': f.deviceToken },
        body: JSON.stringify({}),
      });
      assert.equal(res.status, 201);
      const body = await res.json();
      assert.ok(/^\d{2}$/.test(body.data.codigo));
      assert.ok(body.data.desafioId);
      fixtureIds.desafioIds.push(body.data.desafioId);
    });

    await t.test('GET /api/desktop/desafio/:id devuelve estado ESPERANDO vía device token', async () => {
      const desafioId = fixtureIds.desafioIds[0];
      const res = await fetch(`${baseUrl}/api/desktop/desafio/${desafioId}`, {
        headers: { 'x-device-token': f.deviceToken },
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.data.estado, 'ESPERANDO');
    });

    await t.test('POST /api/desktop/liberar con código incorrecto devuelve 404', async () => {
      const res = await fetch(`${baseUrl}/api/desktop/liberar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenEstudiante}` },
        body: JSON.stringify({ codigo: '00', laboratorioId: f.laboratorioId }),
      });
      assert.equal(res.status, 404);
    });

    await t.test('POST /api/desktop/liberar sin token devuelve 401', async () => {
      const res = await fetch(`${baseUrl}/api/desktop/liberar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: '11' }),
      });
      assert.equal(res.status, 401);
    });

    await t.test('POST /api/desktop/liberar con código válido registra uso y marca asistencia', async () => {
      const codigo = await obtenerCodigoDesafio(f.deviceToken);
      const res = await fetch(`${baseUrl}/api/desktop/liberar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenEstudiante}` },
        body: JSON.stringify({ codigo, laboratorioId: f.laboratorioId }),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.data.estado, 'LIBERADO');
      assert.ok(body.data.usoEquipoId);
      assert.equal(body.data.laboratorio.id, f.laboratorioId);
      assert.ok(body.data.asistencia, 'El desbloqueo debe marcar asistencia cuando hay sesión activa');
      assert.equal(body.data.asistencia.estado, 'PRESENTE');
      fixtureIds.usoIds.push(body.data.usoEquipoId);

      const asistenciaDb = await prisma.asistenciaEstudiante.findUnique({
        where: { sesionBitacoraId_estudianteId: { sesionBitacoraId: f.sesionId, estudianteId: f.estudianteId } },
      });
      assert.equal(asistenciaDb?.origen, 'DESBLOQUEO_PC');
      assert.equal(asistenciaDb?.equipoId, f.equipoId);
    });

    await t.test('El desafío liberado ya no puede reutilizarse', async () => {
      const desafioId = fixtureIds.desafioIds[1] || fixtureIds.desafioIds[0];
      const res = await fetch(`${baseUrl}/api/desktop/desafio/${desafioId}`, {
        headers: { 'x-device-token': f.deviceToken },
      });
      const body = await res.json();
      assert.equal(body.data.estado, 'LIBERADO');
    });

    await t.test('GET /api/desktop/desafio sin device token devuelve 401', async () => {
      const res = await fetch(`${baseUrl}/api/desktop/desafio/${fixtureIds.desafioIds[0]}`, {});
      assert.equal(res.status, 401);
    });
  } finally {
    await limpiarFixtures(f);
  }
});

test('POST /api/bitacora/marcar-asistencia auto-asigna equipo desde UsoEquipo activo', async (t) => {
  const hash = bcryptjs.hashSync('ClaveTest2026*', 10);
  const suf = 'AA' + Date.now();

  const estudiante = await prisma.usuario.create({
    data: { nombre: 'AA', apellido: 'Est', username: suf, correo: `${suf}@t.bo`, password: hash, activo: true },
  });
  const admin = await prisma.usuario.create({
    data: { nombre: 'AA', apellido: 'Adm', username: `${suf}a`, correo: `${suf}a@t.bo`, password: hash, activo: true },
  });
  const fac = await prisma.facultad.create({ data: { nombre: `F ${suf}`, sigla: `FS${suf.slice(-4)}` } });
  const lab = await prisma.laboratorio.create({ data: { codigo: `LB${suf}`, nombre: `L ${suf}`, facultadId: fac.id } });
  const equipo = await prisma.equipo.create({
    data: { codigoPatrimonial: `EQ-${suf}`, nombre: `PC ${suf}`, laboratorioId: lab.id },
  });
  const plan = await prisma.planEstudio.create({
    data: { carreraId: (await prisma.carrera.create({ data: { nombre: `C ${suf}`, facultadId: fac.id } })).id, gestion: ANYO, descripcion: `P ${suf}` },
  });
  const materia = await prisma.materia.create({
    data: { codigo: `MT${suf}`, nombre: `M ${suf}`, planId: plan.id, semestre: 1 },
  });
  const sesion = await prisma.sesionBitacora.create({
    data: {
      laboratorioId: lab.id,
      materiaId: materia.id,
      fecha: new Date(),
      horaInicio: new Date().toTimeString().slice(0, 5),
      horaFin: '',
      cumplio: false,
      grupo: 1,
      semestre: 1,
      gestion: 2026,
      tokenQR: `tk-${suf}`,
    },
  });

  await prisma.inscripcionMateria.create({
    data: { estudianteId: estudiante.id, materiaId: materia.id, grupo: 1, semestre: 1, gestion: 2026, estado: 'ACTIVA' },
  });

  const uso = await prisma.usoEquipo.create({
    data: { equipoId: equipo.id, laboratorioId: lab.id, estudianteId: estudiante.id, estado: 'ACTIVO' },
  });

  const tokenEst = jwt.sign(
    { id: estudiante.id, correo: `${suf}@t.bo`, roles: ['Estudiante'], permisos: ['bitacora:consultar'] },
    secret,
    { expiresIn: '1h' },
  );

  try {
    await t.test('La asistencia se crea con equipoId del UsoEquipo activo', async () => {
      const res = await fetch(`${baseUrl}/api/bitacora/marcar-asistencia`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenEst}` },
        body: JSON.stringify({ tokenQR: `tk-${suf}` }),
      });
      assert.equal(res.status, 200);
      const body = await res.json();
      assert.equal(body.status, 'success');
      assert.equal(body.data.equipo, equipo.codigoPatrimonial, 'El equipo debe auto-asignarse desde el UsoEquipo activo');

      const asistenciaDb = await prisma.asistenciaEstudiante.findUnique({
        where: { sesionBitacoraId_estudianteId: { sesionBitacoraId: sesion.id, estudianteId: estudiante.id } },
      });
      assert.equal(asistenciaDb?.equipoId, uso.equipoId);
      assert.equal(asistenciaDb?.origen, 'QR_ESTUDIANTE');
    });
  } finally {
    await prisma.asistenciaEstudiante.deleteMany({ where: { sesionBitacoraId: sesion.id } }).catch(() => undefined);
    await prisma.usoEquipo.deleteMany({ where: { id: uso.id } }).catch(() => undefined);
    await prisma.inscripcionMateria.deleteMany({ where: { materiaId: materia.id } }).catch(() => undefined);
    await prisma.sesionBitacora.deleteMany({ where: { id: sesion.id } }).catch(() => undefined);
    await prisma.equipo.deleteMany({ where: { id: equipo.id } }).catch(() => undefined);
    await prisma.laboratorio.deleteMany({ where: { id: lab.id } }).catch(() => undefined);
    await prisma.materia.deleteMany({ where: { id: materia.id } }).catch(() => undefined);
    await prisma.planEstudio.deleteMany({ where: { id: plan.id } }).catch(() => undefined);
    await prisma.facultad.deleteMany({ where: { id: fac.id } }).catch(() => undefined);
    await prisma.usuario.deleteMany({ where: { id: { in: [estudiante.id, admin.id] } } }).catch(() => undefined);
  }
});

async function obtenerCodigoDesafio(deviceToken: string): Promise<string> {
  const resBloqueoSegundo = await fetch(`${baseUrl}/api/desktop/bloquear`, {
    method: 'POST',
    headers: { 'x-device-token': deviceToken },
    body: JSON.stringify({}),
  });
  const body = await resBloqueoSegundo.json();
  fixtureIds.desafioIds.push(body.data.desafioId);
  return body.data.codigo;
}