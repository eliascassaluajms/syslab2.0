import test from 'node:test';
import assert from 'node:assert/strict';

import { validarAsignacionTribunal, resumirEstadoTrabajo } from '../src/services/defensa.service.js';

test('valida que un tribunal tenga rol único y al menos un docente', () => {
  const resultado = validarAsignacionTribunal([
    { rol: 'PRESIDENTE', docenteId: 10 },
    { rol: 'SECRETARIO', docenteId: 11 },
    { rol: 'VOCAL', docenteId: 12 },
  ]);

  assert.equal(resultado.valido, true);
  assert.equal(resultado.errores.length, 0);
});

test('rechaza tribunales duplicados por rol o sin datos mínimos', () => {
  const resultado = validarAsignacionTribunal([
    { rol: 'PRESIDENTE', docenteId: 10 },
    { rol: 'PRESIDENTE', docenteId: 11 },
    { rol: 'VOCAL', docenteId: 12 },
    { rol: 'SECRETARIO', docenteId: 0 },
  ]);

  assert.equal(resultado.valido, false);
  assert.ok(resultado.errores.some((error) => error.includes('PRESIDENTE')));
  assert.ok(resultado.errores.some((error) => error.includes('docente')));
});

test('resume el flujo del trabajo de grado con el estado correcto', () => {
  const resumen = resumirEstadoTrabajo({
    estado: 'APTO_PARA_DEFENSA',
    versionesDocumento: [{ id: 'v1' }, { id: 'v2' }],
    observaciones: [{ id: 'o1' }, { id: 'o2' }],
    tribunales: [{ rol: 'PRESIDENTE' }, { rol: 'SECRETARIO' }, { rol: 'VOCAL' }],
  });

  assert.equal(resumen.estado, 'APTO_PARA_DEFENSA');
  assert.equal(resumen.versiones, 2);
  assert.equal(resumen.tribunales, 3);
  assert.equal(resumen.observaciones, 2);
});
