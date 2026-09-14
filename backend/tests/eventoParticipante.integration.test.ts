import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs';
import path from 'path';
import app from '../src/app.js';

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
});

test('Fase 2 (Integración) - Ciclo de Vida de Comprobantes Temporales', async (t) => {
  const targetDir = path.resolve(process.cwd(), '../frontend/public/comprobantes');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  await t.test('elimina físicamente un comprobante temporal del disco y previene archivos huérfanos', async () => {
    const filename = 'comprobante_temp_integration_test.jpg';
    const filePath = path.join(targetDir, filename);
    fs.writeFileSync(filePath, 'fake image content');
    assert.equal(fs.existsSync(filePath), true, 'el archivo temporal debe existir antes de llamar al endpoint');

    const res = await fetch(`${baseUrl}/api/evento-participantes/comprobante-temp`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comprobanteUrl: `/api/comprobantes/${filename}` }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.status, 'success');
    assert.equal(data.eliminado, true);
    assert.equal(fs.existsSync(filePath), false, 'el archivo temporal debe haber sido eliminado del disco');
  });


  await t.test('bloquea intentos de Path Traversal con código HTTP 400', async () => {
    const payloads = [
      '../../../../etc/passwd',
      '..\\..\\boot.ini',
      '/var/www/syslab/index.html',
      'malicious_script.sh',
      'comprobante_hack.exe',
    ];

    for (const url of payloads) {
      const res = await fetch(`${baseUrl}/api/evento-participantes/comprobante-temp`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comprobanteUrl: url }),
      });

      assert.equal(res.status, 400, `Debe rechazar ${url} con 400`);
      const data = await res.json();
      assert.equal(data.status, 'fail');
    }
  });

  await t.test('retorna HTTP 400 si falta comprobanteUrl en el cuerpo', async () => {
    const res = await fetch(`${baseUrl}/api/evento-participantes/comprobante-temp`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    assert.equal(res.status, 400);
  });
});

test('Fase 2 (Integración) - Validaciones de Seguridad en Preinscripción', async (t) => {
  await t.test('detecta honeypot silenciosamente sin procesar el registro en base de datos', async () => {
    const res = await fetch(`${baseUrl}/api/evento-participantes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Bot',
        apellido: 'Spammer',
        correo: 'bot@spam.com',
        telefono: '70000000',
        tipo: 'ESTUDIANTE',
        honeypot: 'spam_detected',
        codigoTransaccion: '10142826090907258247',
      }),
    });

    assert.equal(res.status, 200, 'Honeypot responde 200 ficticio para engañar al bot');
    const data = await res.json();
    assert.equal(data.status, 'success');
  });

  await t.test('rechaza envíos demasiado rápidos (<2.5s) con HTTP 403', async () => {
    const res = await fetch(`${baseUrl}/api/evento-participantes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Rapid',
        apellido: 'Bot',
        correo: 'rapid@bot.com',
        telefono: '70000000',
        tipo: 'ESTUDIANTE',
        formStartTime: Date.now() - 500, // Hace solo 0.5s
        codigoTransaccion: '10142826090907258247',
      }),
    });

    assert.equal(res.status, 403);
    const data = await res.json();
    assert.match(data.message || '', /automatizado/i);
  });


  await t.test('rechaza códigos de transacción bancaria no numéricos', async () => {
    const res = await fetch(`${baseUrl}/api/evento-participantes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: 'Carlos',
        apellido: 'Mendoza',
        correo: 'carlos.mendoza@uajms.edu.bo',
        telefono: '71234567',
        tipo: 'ESTUDIANTE',
        codigoTransaccion: 'TRANSACCION_INVALIDA_CON_LETRAS',
        formStartTime: Date.now() - 5000,
      }),
    });

    assert.equal(res.status, 400);
  });

  await t.test('rechaza envíos sin campos requeridos', async () => {
    const res = await fetch(`${baseUrl}/api/evento-participantes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: '',
        correo: '',
      }),
    });

    assert.equal(res.status, 400);
  });
});
