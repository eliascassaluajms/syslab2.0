import test from 'node:test';
import assert from 'node:assert/strict';

import {
  validarAsignacionTribunal,
  resumirEstadoTrabajo,
  DIAS_HABILES_OBSERVACIONES,
} from '../src/services/defensa.service.js';

test('valida una designación de exactamente 2 tribunales con rol TRIBUNAL', () => {
  const resultado = validarAsignacionTribunal([
    { rol: 'TRIBUNAL', docenteId: 10, preside: true },
    { rol: 'TRIBUNAL', docenteId: 11 },
  ]);

  assert.equal(resultado.valido, true);
  assert.equal(resultado.errores.length, 0);
});

test('valida un tribunal externo con datos completos (sin docente interno)', () => {
  const resultado = validarAsignacionTribunal([
    { rol: 'TRIBUNAL', docenteId: 10 },
    { esExterno: true, rol: 'TRIBUNAL', nombre: 'Carlos', apellido: 'Mamani', correo: 'carlos@externo.com' },
  ]);

  assert.equal(resultado.valido, true);
  assert.equal(resultado.errores.length, 0);
});

test('rechaza designación con más de dos tribunales', () => {
  const resultado = validarAsignacionTribunal([
    { rol: 'TRIBUNAL', docenteId: 10 },
    { rol: 'TRIBUNAL', docenteId: 11 },
    { rol: 'TRIBUNAL', docenteId: 12 },
  ]);

  assert.equal(resultado.valido, false);
  assert.ok(resultado.errores.some((error) => error.includes('exactamente 2')));
});

test('rechaza un mismo docente repetido en el tribunal', () => {
  const resultado = validarAsignacionTribunal([
    { rol: 'TRIBUNAL', docenteId: 10 },
    { rol: 'TRIBUNAL', docenteId: 10 },
  ]);

  assert.equal(resultado.valido, false);
  assert.ok(resultado.errores.some((error) => error.includes('dos veces')));
});

test('rechaza dos tribunales que presiden simultáneamente', () => {
  const resultado = validarAsignacionTribunal([
    { rol: 'TRIBUNAL', docenteId: 10, preside: true },
    { rol: 'TRIBUNAL', docenteId: 11, preside: true },
  ]);

  assert.equal(resultado.valido, false);
  assert.ok(resultado.errores.some((error) => error.includes('presidir')));
});

test('rechaza tribunal externo sin datos mínimos', () => {
  const resultado = validarAsignacionTribunal([
    { rol: 'TRIBUNAL', docenteId: 10 },
    { esExterno: true, rol: 'TRIBUNAL' },
  ]);

  assert.equal(resultado.valido, false);
  assert.ok(resultado.errores.some((error) => error.includes('nombre, apellido y correo')));
});

test('rechaza tribunal interno sin docente válido', () => {
  const resultado = validarAsignacionTribunal([
    { rol: 'TRIBUNAL', docenteId: 0 },
    { rol: 'TRIBUNAL', docenteId: 11 },
  ]);

  assert.equal(resultado.valido, false);
  assert.ok(resultado.errores.some((error) => error.includes('docente válido')));
});

test('el plazo de observaciones es de 5 días hábiles', () => {
  assert.equal(DIAS_HABILES_OBSERVACIONES, 5);
});

test('resume el flujo del trabajo de grado con 2 tribunales y el que preside', () => {
  const resumen = resumirEstadoTrabajo({
    estado: 'APTO_PARA_DEFENSA',
    versionesDocumento: [{ id: 'v1' }, { id: 'v2' }],
    observaciones: [{ id: 'o1' }],
    tribunales: [{ rol: 'TRIBUNAL', preside: true }, { rol: 'TRIBUNAL' }],
  });

  assert.equal(resumen.estado, 'APTO_PARA_DEFENSA');
  assert.equal(resumen.versiones, 2);
  assert.equal(resumen.tribunales, 2);
  assert.equal(resumen.observaciones, 1);
  assert.equal(resumen.preside, 'TRIBUNAL');
});