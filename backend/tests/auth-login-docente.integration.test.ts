import test from 'node:test';
import assert from 'node:assert/strict';
import bcryptjs from 'bcryptjs';
import crypto from 'crypto';

import { app, prisma } from './helpers/environment.js';

const sufijo = crypto.randomBytes(4).toString('hex');
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
  await prisma.$disconnect();
});

async function firmarCorreo(rol: string) {
  const hash = bcryptjs.hashSync('ClaveLoginDocente2026*', 10);
  const rolBd = await prisma.rol.findFirst({ where: { nombre: rol } });
  const slug = rol.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const usuario = await prisma.usuario.create({
    data: {
      nombre: `${rol}Login`,
      apellido: `Test${sufijo}`,
      username: `${slug}_login_${sufijo}`,
      correo: `${slug}_login_${sufijo}@uajms.edu.bo`,
      password: hash,
      activo: true,
      rolId: rolBd?.id ?? null,
    },
  });
  return { correo: usuario.correo, password: 'ClaveLoginDocente2026*', rolBd: rolBd?.nombre ?? null };
}

test('login-docente acepta a un Docente', async () => {
  const { correo, password } = await firmarCorreo('Docente');
  const res = await fetch(`${baseUrl}/api/auth/login-docente`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo, password }),
  });
  const json: any = await res.json();
  assert.equal(res.status, 200);
  assert.equal(json.status, 'success');
});

test('login-docente acepta a un Director de Carrera', async () => {
  const { correo, password } = await firmarCorreo('Director de Carrera');
  const res = await fetch(`${baseUrl}/api/auth/login-docente`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo, password }),
  });
  assert.equal(res.status, 200);
});

test('login-docente rechaza a un Estudiante', async () => {
  const { correo, password } = await firmarCorreo('Estudiante');
  const res = await fetch(`${baseUrl}/api/auth/login-docente`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo, password }),
  });
  const json: any = await res.json();
  assert.equal(res.status, 403);
  assert.match(json.message, /docente/i);
});

test('login-docente rechaza credenciales inválidas', async () => {
  const res = await fetch(`${baseUrl}/api/auth/login-docente`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo: `no_existe_${sufijo}@uajms.edu.bo`, password: 'Incorrecta123*' }),
  });
  assert.equal(res.status, 401);
});