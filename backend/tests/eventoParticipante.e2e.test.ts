import test from 'node:test';
import assert from 'node:assert/strict';

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('postgres-db:5432')) {
  process.env.DATABASE_URL = 'postgresql://admin_syslab:SecretPassword2026@127.0.0.1:5434/syslab_db?schema=public';
}

import app from '../src/app.js';
import { prisma } from '../src/config/prisma.js';

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
    await new Promise<void>((resolve) => server.close(resolve));
  }
  // Limpieza de datos creados en el test E2E
  try {
    await prisma.eventoParticipante.deleteMany({
      where: {
        correo: 'carlos.mendoza@uajms.edu.bo',
      },
    });
    await prisma.$disconnect();
  } catch (err) {
    // Ignorar errores de cierre
  }
});

test('Fase 3 (E2E y Flujo Real) - Recorrido del Participante y Verificación de Proxy', async (t) => {
  let activeActivityId: string;
  let createdParticipantId: string;

  await t.test('Paso 1: Consulta y selección de evento activo en el catálogo público', async () => {
    const res = await fetch(`${baseUrl}/api/activities?soloActivos=true`);
    assert.equal(res.status, 200, 'Debe responder 200 OK');
    const activities = await res.json();
    assert.ok(Array.isArray(activities) && activities.length > 0, 'Debe haber actividades activas');

    const citren = activities.find((a: any) => a.title.includes('CITREN')) || activities[0];
    assert.ok(citren, 'Debe encontrarse una actividad válida');
    assert.equal(citren.activo, true, 'La actividad debe estar activa');
    activeActivityId = citren.id;
  });

  await t.test('Paso 2: Preinscripción con datos no formateados, sanitización y persistencia', async () => {
    const payload = {
      nombre: '   cArLoS   aLbErTo   ',
      apellido: '   mEnDoZa   rOcHa   ',
      correo: '   CARLOS.MENDOZA@UAJMS.EDU.BO   ',
      telefono: '71234567',
      tipo: 'ESTUDIANTE_FIRNT',
      codigoTransaccion: '7281940285', // 10 dígitos numéricos válidos
      montoPagado: 100,
      activityId: activeActivityId,
      formStartTime: Date.now() - 5000, // Simula 5 segundos en el formulario
      honeypot: '',
      comprobanteUrl: '/api/comprobantes/comprobante_1789384793344.jpeg',
    };

    const res = await fetch(`${baseUrl}/api/evento-participantes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    assert.equal(res.status, 201, 'Debe responder 201 Created');
    const data = await res.json();
    assert.ok(data.id, 'Debe retornar el ID del participante creado');
    createdParticipantId = data.id;

    // Verificar en la base de datos la sanitización y formato de nombres propios
    const savedInDb = await prisma.eventoParticipante.findUnique({
      where: { id: createdParticipantId },
    });

    assert.ok(savedInDb, 'El participante debe existir en la base de datos');
    assert.equal(savedInDb.nombre, 'Carlos Alberto', 'Nombre propio debe tener formato capitalizado limpio');
    assert.equal(savedInDb.apellido, 'Mendoza Rocha', 'Apellido debe tener formato capitalizado limpio');
    assert.equal(savedInDb.correo, 'carlos.mendoza@uajms.edu.bo', 'Correo debe estar en minúsculas y sin espacios');
    assert.equal(savedInDb.codigoTransaccion, '7281940285', 'Código de transacción debe almacenarse íntegro');
    assert.equal(savedInDb.estado, 'PRE_INSCRITO', 'El estado inicial debe ser PRE_INSCRITO');
  });

  await t.test('Paso 3: Generación y descarga del Comprobante PDF (Voucher)', async () => {
    assert.ok(createdParticipantId, 'Debe haber un ID de participante registrado');

    const res = await fetch(`${baseUrl}/api/evento-participantes/${createdParticipantId}/voucher`);
    assert.equal(res.status, 200, 'Debe responder 200 OK');

    // Verificar cabeceras HTTP de archivo binario PDF
    const contentType = res.headers.get('content-type');
    assert.equal(contentType, 'application/pdf', 'El Content-Type debe ser application/pdf');

    const contentDisposition = res.headers.get('content-disposition');
    assert.ok(contentDisposition?.includes('attachment'), 'Debe ser una descarga de tipo attachment');
    assert.ok(contentDisposition?.includes('comprobante_Mendoza_Rocha.pdf'), 'El nombre del archivo debe contener el apellido');

    // Verificar estructura del buffer binario (firma estándar %PDF-)
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    assert.ok(buffer.length > 1000, 'El documento PDF generado debe tener un tamaño válido (> 1KB)');
    const headerString = buffer.subarray(0, 5).toString('ascii');
    assert.equal(headerString, '%PDF-', 'El archivo debe comenzar con la firma mágica estándar de PDF (%PDF-)');
  });

  await t.test('Paso 4: Enrutamiento y Proxy de Comprobantes (garantía anti-SPA fallback)', async () => {
    // 1. Petición directa a /api/comprobantes/:filename
    const resApi = await fetch(`${baseUrl}/api/comprobantes/comprobante_1789384793344.jpeg`);
    assert.equal(resApi.status, 200, 'Debe responder 200 para comprobante existente');
    const apiContentType = resApi.headers.get('content-type');
    assert.ok(
      apiContentType?.startsWith('image/'),
      `Content-Type debe ser image/*, recibido: ${apiContentType}`
    );
    assert.notEqual(
      apiContentType,
      'text/html',
      'No debe devolver text/html ni la página de la SPA'
    );

    // 2. Petición a /comprobantes/:filename (ruta alternativa)
    const resAlt = await fetch(`${baseUrl}/comprobantes/comprobante_1789384793344.jpeg`);
    assert.equal(resAlt.status, 200, 'Ruta alternativa debe responder 200');
    const altContentType = resAlt.headers.get('content-type');
    assert.ok(altContentType?.startsWith('image/'), 'Content-Type debe ser image/*');

    // 3. Petición a comprobante inexistente
    const resNotFound = await fetch(`${baseUrl}/api/comprobantes/no-existe-xyz.jpg`);
    assert.equal(resNotFound.status, 404, 'Archivo inexistente debe devolver 404 estático');
    const notFoundType = resNotFound.headers.get('content-type');
    assert.notEqual(
      notFoundType,
      'text/html; charset=utf-8',
      'No debe retornar el index.html de React en 404 de /api/'
    );
  });
});
