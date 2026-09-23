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

test.after(async () => {
  if (server) {
    if (typeof server.closeAllConnections === 'function') {
      server.closeAllConnections();
    }
    await new Promise<void>((resolve) => server.close(resolve));
  }
  await prisma?.$disconnect();
});

const sufijo = crypto.randomBytes(4).toString('hex');

async function crearUsuarioPrueba(rol: string) {
  const hash = bcryptjs.hashSync('ClaveRefresh2026*', 10);
  const rolBd = await prisma.rol.findFirst({ where: { nombre: rol } });
  const slug = rol.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const unico = crypto.randomBytes(4).toString('hex');

  const usuario = await prisma.usuario.create({
    data: {
      nombre: `${rol}Ref`,
      apellido: `Test${sufijo}`,
      username: `${slug}_ref_${unico}`,
      correo: `${slug}_ref_${unico}@uajms.edu.bo`,
      password: hash,
      activo: true,
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

test('POST /api/auth/login emite Access Token y Refresh Token', async () => {
  const usuario = await crearUsuarioPrueba('Docente');
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo: usuario.correo, password: 'ClaveRefresh2026*' }),
  });

  const json: any = await res.json();
  assert.equal(res.status, 200);
  assert.equal(json.status, 'success');
  assert.ok(json.token, 'Debe devolver access token JWT');
  assert.ok(json.refreshToken, 'Debe devolver refresh token rotativo');
  assert.equal(typeof json.refreshToken, 'string');
  assert.equal(json.data?.usuario?.id, usuario.id);

  // Verificar que el hash existe en base de datos
  const hash = crypto.createHash('sha256').update(json.refreshToken).digest('hex');
  const enBd = await prisma.refreshToken.findUnique({ where: { tokenHash: hash } });
  assert.ok(enBd);
  assert.equal(enBd.usuarioId, usuario.id);
  assert.equal(enBd.revocado, false);
});

test('POST /api/auth/refresh renueva sesión y aplica rotación estricta de tokens', async () => {
  const usuario = await crearUsuarioPrueba('Docente');
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo: usuario.correo, password: 'ClaveRefresh2026*' }),
  });
  const { token: primerToken, refreshToken: primerRefresh } = (await loginRes.json()) as any;

  // Invocar /api/auth/refresh
  const refreshRes = await fetch(`${baseUrl}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: primerRefresh }),
  });
  const refreshJson: any = await refreshRes.json();

  assert.equal(refreshRes.status, 200);
  assert.equal(refreshJson.status, 'success');
  assert.ok(refreshJson.token, 'Debe devolver nuevo access token');
  assert.ok(refreshJson.refreshToken, 'Debe devolver nuevo refresh token');
  assert.notEqual(refreshJson.refreshToken, primerRefresh, 'El refresh token debe rotar');

  // El token anterior debe quedar revocado y vinculado al nuevo
  const hashAnterior = crypto.createHash('sha256').update(primerRefresh).digest('hex');
  const hashNuevo = crypto.createHash('sha256').update(refreshJson.refreshToken).digest('hex');

  const bdAnterior = await prisma.refreshToken.findUnique({ where: { tokenHash: hashAnterior } });
  assert.equal(bdAnterior?.revocado, true);
  assert.equal(bdAnterior?.reemplazadoPorHash, hashNuevo);

  const bdNuevo = await prisma.refreshToken.findUnique({ where: { tokenHash: hashNuevo } });
  assert.equal(bdNuevo?.revocado, false);
  assert.equal(bdNuevo?.usuarioId, usuario.id);
});

test('Detección de reuso: intentar reutilizar un refresh token revocado invalida todos los tokens', async () => {
  const usuario = await crearUsuarioPrueba('Docente');
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo: usuario.correo, password: 'ClaveRefresh2026*' }),
  });
  const { refreshToken: tokenInicial } = (await loginRes.json()) as any;

  // Rotación normal
  const refresh1 = await fetch(`${baseUrl}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: tokenInicial }),
  });
  assert.equal(refresh1.status, 200);
  const { refreshToken: tokenRotado } = (await refresh1.json()) as any;

  // Reintento malicioso o anómalo con el token inicial que ya fue revocado
  const reuso = await fetch(`${baseUrl}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: tokenInicial }),
  });
  assert.equal(reuso.status, 401);
  const jsonReuso: any = await reuso.json();
  assert.match(jsonReuso.message, /reuso/i);

  // Como medida de seguridad, el token rotado activo también debió ser revocado
  const hashRotado = crypto.createHash('sha256').update(tokenRotado).digest('hex');
  const bdRotado = await prisma.refreshToken.findUnique({ where: { tokenHash: hashRotado } });
  assert.equal(bdRotado?.revocado, true, 'El token activo debe revocarse ante detección de reuso');
});

test('POST /api/auth/refresh rechaza tokens inexistentes o malformados', async () => {
  const vacio = await fetch(`${baseUrl}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  assert.equal(vacio.status, 400);

  const falso = await fetch(`${baseUrl}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken: 'token_totalmente_inexistente_123456789' }),
  });
  assert.equal(falso.status, 401);
});

test('POST /api/auth/logout revoca el refresh token', async () => {
  const usuario = await crearUsuarioPrueba('Docente');
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo: usuario.correo, password: 'ClaveRefresh2026*' }),
  });
  const { refreshToken } = (await loginRes.json()) as any;

  const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  assert.equal(logoutRes.status, 200);

  // Intentar refrescar con el token deslogueado debe ser rechazado
  const refreshFail = await fetch(`${baseUrl}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  assert.equal(refreshFail.status, 401);
});
