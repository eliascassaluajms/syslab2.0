import test from 'node:test';
import assert from 'node:assert/strict';

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('postgres-db:5432')) {
  process.env.DATABASE_URL = 'postgresql://admin_syslab:SecretPassword2026@127.0.0.1:5434/syslab_db?schema=public';
}

import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

let server: any;
let baseUrl: string;
const secret = process.env.JWT_SECRET || 'syslab_secreto_super_seguro_uajms';

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
    await new Promise<void>((resolve) => server.close(resolve));
  }
  await prisma.$disconnect();
});

test('Módulo de Actividades - Rutas PUT / GET / PATCH y Alias /api/actividades', async (t) => {
  // Token de administrador para operaciones protegidas
  const tokenAdmin = jwt.sign(
    { id: 1, correo: 'admin@uajms.edu.bo', roles: ['Administrador'] },
    secret,
    { expiresIn: '1h' }
  );

  let testActivityId: string;

  await t.test('GET /api/activities y GET /api/actividades retornan la lista de actividades', async () => {
    const resEn = await fetch(`${baseUrl}/api/activities?soloActivos=true`);
    assert.equal(resEn.status, 200);
    const listEn = await resEn.json();
    assert.ok(Array.isArray(listEn) && listEn.length > 0);

    const resEs = await fetch(`${baseUrl}/api/actividades?soloActivos=true`);
    assert.equal(resEs.status, 200);
    const listEs = await resEs.json();
    assert.ok(Array.isArray(listEs) && listEs.length > 0);

    testActivityId = listEn[0].id;
    assert.ok(testActivityId, 'Debe haber un ID UUID de actividad');
  });

  await t.test('GET /api/activities/:id y /api/actividades/:id retornan el detalle de la actividad', async () => {
    const res = await fetch(`${baseUrl}/api/activities/${testActivityId}`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.id, testActivityId);
    assert.ok(data.title);

    const resEs = await fetch(`${baseUrl}/api/actividades/${testActivityId}`);
    assert.equal(resEs.status, 200);
    const dataEs = await resEs.json();
    assert.equal(dataEs.id, testActivityId);
  });

  await t.test('PUT /api/activities/:id actualiza correctamente la actividad con UUID', async () => {
    const updatePayload = {
      title: 'CITREN 2026 - Congreso Internacional Actualizado',
      description: 'Descripción actualizada vía prueba automatizada de integración',
      careerScope: '2',
      labId: 1,
      activo: true,
    };

    const res = await fetch(`${baseUrl}/api/activities/${testActivityId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`,
      },
      body: JSON.stringify(updatePayload),
    });

    assert.equal(res.status, 200, 'Debe retornar 200 OK');
    const updated = await res.json();
    assert.equal(updated.id, testActivityId);
    assert.equal(updated.title, 'CITREN 2026 - Congreso Internacional Actualizado');
    assert.equal(updated.description, 'Descripción actualizada vía prueba automatizada de integración');
  });

  await t.test('PUT /api/actividades/:id (alias en español) actualiza igualmente con UUID', async () => {
    const updatePayload = {
      title: 'CITREN 2026 - Congreso Internacional de Tecnologías de Redes y Ingeniería',
      description: 'Congreso anual que reúne a investigadores, docentes y estudiantes para debatir avances.',
    };

    const res = await fetch(`${baseUrl}/api/actividades/${testActivityId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`,
      },
      body: JSON.stringify(updatePayload),
    });

    assert.equal(res.status, 200, 'Debe retornar 200 OK');
    const updated = await res.json();
    assert.equal(updated.id, testActivityId);
    assert.equal(updated.title, 'CITREN 2026 - Congreso Internacional de Tecnologías de Redes y Ingeniería');
  });

  await t.test('PUT /api/activities/:id con UUID inexistente retorna 404 controlado', async () => {
    const uuidInexistente = '00000000-0000-0000-0000-000000000000';
    const res = await fetch(`${baseUrl}/api/activities/${uuidInexistente}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`,
      },
      body: JSON.stringify({ title: 'No existe' }),
    });

    assert.equal(res.status, 404);
  });

  await t.test('PATCH /api/activities/:id/estado actualiza el estado activo', async () => {
    const res = await fetch(`${baseUrl}/api/activities/${testActivityId}/estado`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenAdmin}`,
      },
      body: JSON.stringify({ activo: true }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.activo, true);
  });
});
