import test from 'node:test';
import assert from 'node:assert/strict';
import bcryptjs from 'bcryptjs';
import crypto from 'crypto';

import { app, prisma } from './helpers/environment.js';

let server: any;
let baseUrl: string;

test.before(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      baseUrl = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
      resolve();
    });
  });
});

const sufijo = crypto.randomBytes(4).toString('hex');

test.after(async () => {
  if (server) {
    if (typeof server.closeAllConnections === 'function') {
      server.closeAllConnections();
    }
    await new Promise<void>((resolve) => server.close(resolve));
  }
  await prisma?.$disconnect();
});

async function crearUsuario(rol: string, esGlobal = false) {
  const hash = bcryptjs.hashSync('ClaveIncidencia2026*', 10);
  const rolBd = await prisma.rol.findFirst({ where: { nombre: rol } });
  const slug = rol.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const unico = crypto.randomBytes(4).toString('hex');
  const usuario = await prisma.usuario.create({
    data: {
      nombre: `${rol}Inc`,
      apellido: `Test${sufijo}`,
      username: `${slug}_inc_${unico}`,
      correo: `${slug}_inc_${unico}@uajms.edu.bo`,
      password: hash,
      activo: true,
      esGlobal,
      rolId: rolBd?.id ?? null,
    },
  });
  if (rolBd) {
    await prisma.asignacionAmbito.create({
      data: {
        usuarioId: usuario.id,
        rolId: rolBd.id,
      },
    });
  }
  return usuario;
}

async function obtenerToken(correo: string, password: string) {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo, password }),
  });
  const json: any = await res.json();
  return json.token as string;
}

async function cuerpoIncidencia(clienteUuid: string, laboratorioId = 1) {
  return {
    clienteUuid,
    laboratorioId,
    equipoId: null,
    titulo: `Fallo de prueba ${sufijo}`,
    descripcion: 'El equipo no arranca durante la clase de prueba.',
    tipo: 'HARDWARE',
    categoriaEquipo: 'PC',
    prioridad: 'MEDIA',
  };
}

test('POST /api/incidencias crea el ticket y devuelve 201 (sin el 403 post-creación)', async () => {
  const usuario = await crearUsuario('Docente');
  const token = await obtenerToken(usuario.correo, 'ClaveIncidencia2026*');
  const res = await fetch(`${baseUrl}/api/incidencias`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(await cuerpoIncidencia(`uuid-fijo-${sufijo}`)),
  });
  const json: any = await res.json();
  assert.equal(res.status, 201);
  assert.equal(json.status, 'success');
  assert.ok(json.data?.incidencia?.id);
  assert.match(json.data.incidencia.folio, /^INC-\d{4}-/);
  assert.equal(json.data.incidencia.estado, 'PENDIENTE');
  assert.equal(json.data.duplicada, false);
});

test('POST con el mismo clienteUuid devuelve el mismo ticket (idempotencia, sin duplicado)', async () => {
  const usuario = await crearUsuario('Docente');
  const token = await obtenerToken(usuario.correo, 'ClaveIncidencia2026*');
  const clienteUuid = `uuid-reintento-${sufijo}`;

  const primera = await fetch(`${baseUrl}/api/incidencias`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(await cuerpoIncidencia(clienteUuid)),
  });
  const jsonPrimera = await primera.json();

  const segunda = await fetch(`${baseUrl}/api/incidencias`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(await cuerpoIncidencia(clienteUuid)),
  });
  const jsonSegunda = await segunda.json();

  assert.equal(primera.status, 201);
  assert.equal(segunda.status, 200);
  assert.equal(jsonSegunda.data.duplicada, true);
  assert.equal(jsonSegunda.data.incidencia.id, jsonPrimera.data.incidencia.id);

  const enBd = await prisma.incidencia.count({ where: { solicitanteId: usuario.id, clienteUuid } });
  assert.equal(enBd, 1);
});

test('GET /:id del propio solicitante OK; de otro docente 403; de esGlobal OK', async () => {
  const dueño = await crearUsuario('Docente');
  const otro = await crearUsuario('Docente');
  const admin = await crearUsuario('Administrador', true);

  const tokenDueño = await obtenerToken(dueño.correo, 'ClaveIncidencia2026*');
  const res = await fetch(`${baseUrl}/api/incidencias`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenDueño}` },
    body: JSON.stringify(await cuerpoIncidencia(`uuid-acceso-${sufijo}`)),
  });
  const { incidencia } = (await res.json()).data;

  const propio = await fetch(`${baseUrl}/api/incidencias/${incidencia.id}`, {
    headers: { Authorization: `Bearer ${tokenDueño}` },
  });
  assert.equal(propio.status, 200);

  const tokenOtro = await obtenerToken(otro.correo, 'ClaveIncidencia2026*');
  const ajeno = await fetch(`${baseUrl}/api/incidencias/${incidencia.id}`, {
    headers: { Authorization: `Bearer ${tokenOtro}` },
  });
  assert.equal(ajeno.status, 403);

  const tokenAdmin = await obtenerToken(admin.correo, 'ClaveIncidencia2026*');
  const global = await fetch(`${baseUrl}/api/incidencias/${incidencia.id}`, {
    headers: { Authorization: `Bearer ${tokenAdmin}` },
  });
  assert.equal(global.status, 200);
});

test('gestionar valida transiciones de estado y exige solución al RESUELTO', async () => {
  const solicitante = await crearUsuario('Docente');
  const jefe = await crearUsuario('Jefe de Laboratorios');

  const tokenSoli = await obtenerToken(solicitante.correo, 'ClaveIncidencia2026*');
  const res = await fetch(`${baseUrl}/api/incidencias`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenSoli}` },
    body: JSON.stringify(await cuerpoIncidencia(`uuid-estados-${sufijo}`)),
  });
  const { incidencia } = (await res.json()).data;
  const tokenJefe = await obtenerToken(jefe.correo, 'ClaveIncidencia2026*');
  const gestionar = (estado: string, solucion?: string) =>
    fetch(`${baseUrl}/api/incidencias/${incidencia.id}/gestionar`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenJefe}` },
      body: JSON.stringify({ estado, solucion }),
    });

  const saltoInvalido = await gestionar('RESUELTO', 'sin pasar por revisión');
  assert.equal(saltoInvalido.status, 400);
  const jsonSalto = await saltoInvalido.json();
  assert.match(jsonSalto.message, /No se puede pasar/);

  const aProceso = await gestionar('EN_PROCESO');
  assert.equal(aProceso.status, 200);

  const resueltoSinSolucion = await gestionar('RESUELTO');
  assert.equal(resueltoSinSolucion.status, 400);
  const jsonSinSolucion = await resueltoSinSolucion.json();
  assert.match(jsonSinSolucion.message, /solución/);

  const resueltoOk = await gestionar('RESUELTO', 'Se reemplazó el disco dañado y se restauraron los datos.');
  assert.equal(resueltoOk.status, 200);
});

test('docente sin fallas:editar recibe 403 al gestionar', async () => {
  const solicitante = await crearUsuario('Docente');
  const otroDocente = await crearUsuario('Docente');
  const tokenSoli = await obtenerToken(solicitante.correo, 'ClaveIncidencia2026*');
  const res = await fetch(`${baseUrl}/api/incidencias`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenSoli}` },
    body: JSON.stringify(await cuerpoIncidencia(`uuid-permiso-${sufijo}`)),
  });
  const { incidencia } = (await res.json()).data;

  const tokenSinEditar = await obtenerToken(otroDocente.correo, 'ClaveIncidencia2026*');
  const gestion = await fetch(`${baseUrl}/api/incidencias/${incidencia.id}/gestionar`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenSinEditar}` },
    body: JSON.stringify({ estado: 'EN_PROCESO' }),
  });
  assert.equal(gestion.status, 403);
});

test('subida de evidencia: sin archivo y MIME inválido devuelven 400', async () => {
  const usuario = await crearUsuario('Docente');
  const token = await obtenerToken(usuario.correo, 'ClaveIncidencia2026*');
  const res = await fetch(`${baseUrl}/api/incidencias`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(await cuerpoIncidencia(`uuid-evidencia-${sufijo}`)),
  });
  const { incidencia } = (await res.json()).data;

  const sinArchivo = await fetch(`${baseUrl}/api/incidencias/${incidencia.id}/evidencia`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(sinArchivo.status, 400);

  const txt = new Blob(['no soy imagen'], { type: 'text/plain' });
  const formInvalido = new FormData();
  formInvalido.append('evidencia', txt, 'prueba.txt');
  const archivoInvalido = await fetch(`${baseUrl}/api/incidencias/${incidencia.id}/evidencia`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formInvalido,
  });
  assert.equal(archivoInvalido.status, 400);

  const extrema = new Blob([new Uint8Array(11 * 1024 * 1024)], { type: 'image/jpeg' });
  const formExtremo = new FormData();
  formExtremo.append('evidencia', extrema, 'enorme.jpg');
  const archivoExtremo = await fetch(`${baseUrl}/api/incidencias/${incidencia.id}/evidencia`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formExtremo,
  });
  assert.equal(archivoExtremo.status, 400);

  const bytes = Buffer.from(
    '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAX/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABBQJ//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPwF//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPwF//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQAGPwJ//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPyF//9oADAMBAAIAAwAAABAf/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAwEBPxB//8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAgBAgEBPxB//8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxB//9k=',
    'base64',
  );
  const img = new Blob([bytes], { type: 'image/jpeg' });
  const formOk = new FormData();
  formOk.append('evidencia', img, 'evidencia.jpg');
  const archivoOk = await fetch(`${baseUrl}/api/incidencias/${incidencia.id}/evidencia`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: formOk,
  });
  assert.equal(archivoOk.status, 200);
});