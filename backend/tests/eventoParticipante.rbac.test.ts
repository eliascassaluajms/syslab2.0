import test from 'node:test';
import assert from 'node:assert/strict';

import jwt from 'jsonwebtoken';
import { app } from './helpers/environment.js';

let server: any;
let baseUrl: string;

test.before(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
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
});

test('Fase 2 (Seguridad y RBAC) - Control de Accesos a Rutas de Pagos y Participantes', async (t) => {
  const secret = process.env.JWT_SECRET || 'syslab_secreto_super_seguro_uajms';

  await t.test('rechaza con HTTP 401 solicitudes sin encabezado Authorization', async () => {
    const res = await fetch(`${baseUrl}/api/evento-participantes`);
    assert.equal(res.status, 401);
    const data = await res.json();
    assert.match(data.error || data.message || '', /iniciado sesión/i);
  });

  await t.test('rechaza con HTTP 401 tokens malformados, vacíos o manipulados', async () => {
    const tokens = [
      'Bearer token_totalmente_falso_invalido',
      'Bearer ',
      'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.corrupto',
    ];

    for (const token of tokens) {
      const res = await fetch(`${baseUrl}/api/evento-participantes`, {
        headers: { Authorization: token },
      });
      assert.equal(res.status, 401);
    }
  });

  await t.test('rechaza con HTTP 401 tokens expirados o firmados con secreto incorrecto', async () => {
    const tokenExpirado = jwt.sign(
      { id: 9999, correo: 'test@uajms.edu.bo', roles: ['Estudiante'] },
      secret,
      { expiresIn: '-10s' }
    );

    const res = await fetch(`${baseUrl}/api/evento-participantes`, {
      headers: { Authorization: `Bearer ${tokenExpirado}` },
    });
    assert.equal(res.status, 401);
  });

  await t.test('rechaza con HTTP 403 a usuarios autenticados sin permiso para validar pagos (ej. Docente)', async () => {
    // Usuario 4 = Docente (sin permiso 'actividades:pagos_validar')
    const tokenDocente = jwt.sign(
      { id: 4, correo: 'cesar.santos@uajms.edu.bo' },
      secret,
      { expiresIn: '1h' }
    );

    const res = await fetch(`${baseUrl}/api/evento-participantes/part-fake-id/validar-pago`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${tokenDocente}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ estado: 'PAGO_VERIFICADO' }),
    });

    assert.equal(res.status, 403, 'Debe retornar 403 Prohibido');
    const data = await res.json();
    assert.match(data.message || data.error || '', /permisos requeridos/i);
  });

  await t.test('autoriza correctamente a usuarios con rol Administrador para listar pagos', async () => {
    // Usuario 1 = Administrador (bypass automático de permisos)
    const tokenAdmin = jwt.sign(
      { id: 1, correo: 'admin@uajms.edu.bo' },
      secret,
      { expiresIn: '1h' }
    );

    const res = await fetch(`${baseUrl}/api/evento-participantes`, {
      headers: {
        Authorization: `Bearer ${tokenAdmin}`,
      },
    });

    assert.equal(res.status, 200, 'Administrador debe poder acceder a la lista de pagos');
    const data = await res.json();
    assert.equal(Array.isArray(data), true);
  });
});

