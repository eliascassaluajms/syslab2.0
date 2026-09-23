import test from 'node:test';
import assert from 'node:assert/strict';
import { ESTADOS_VALIDOS, TRANSICIONES_PERMITIDAS, transicionPermitida } from '../src/utils/incidencia.estados.js';

test('la máquina acepta cada uno de los estados válidos', () => {
  assert.deepEqual(ESTADOS_VALIDOS.sort(), [
    'DESCARTADO',
    'EN_PROCESO',
    'EN_REVISION',
    'PENDIENTE',
    'RESUELTO',
  ].sort());
});

test('cada estado tiene un repertorio de destinos declarado', () => {
  for (const estado of ESTADOS_VALIDOS) {
    assert.ok(Array.isArray(TRANSICIONES_PERMITIDAS[estado]), `${estado} debe declarar destinos`);
  }
});

const CASOS_VALIDOS = [
  ['PENDIENTE', 'EN_REVISION'],
  ['PENDIENTE', 'EN_PROCESO'],
  ['PENDIENTE', 'DESCARTADO'],
  ['EN_REVISION', 'EN_PROCESO'],
  ['EN_REVISION', 'RESUELTO'],
  ['EN_REVISION', 'DESCARTADO'],
  ['EN_REVISION', 'PENDIENTE'],
  ['EN_PROCESO', 'RESUELTO'],
  ['EN_PROCESO', 'DESCARTADO'],
  ['EN_PROCESO', 'PENDIENTE'],
  ['RESUELTO', 'PENDIENTE'],
  ['RESUELTO', 'EN_PROCESO'],
  ['DESCARTADO', 'PENDIENTE'],
  ['DESCARTADO', 'EN_REVISION'],
  ['PENDIENTE', 'PENDIENTE'], // no-op permitido (actual === destino)
];

for (const [actual, destino] of CASOS_VALIDOS) {
  test(`permite ${actual} → ${destino}`, () => {
    assert.equal(transicionPermitida(actual as any, destino as any), true);
  });
}

const CASOS_INVALIDOS = [
  ['PENDIENTE', 'RESUELTO'],
  ['DESCARTADO', 'RESUELTO'],
  ['RESUELTO', 'DESCARTADO'],
  ['RESUELTO', 'RESUELTO-noop-invalido' as any],
  ['NO_EXISTE' as any, 'PENDIENTE'],
  ['PENDIENTE', 'NO_EXISTE' as any],
];

for (const [actual, destino] of CASOS_INVALIDOS) {
  test(`rechaza ${actual} → ${destino}`, () => {
    assert.equal(transicionPermitida(actual as any, destino as any), false);
  });
}

test('no permite saltar de PENDIENTE a RESUELTO directamente', () => {
  assert.equal(transicionPermitida('PENDIENTE', 'RESUELTO'), false);
});

test('permite reabrir un ticket RESUELTO hacia EN_PROCESO o PENDIENTE', () => {
  assert.equal(transicionPermitida('RESUELTO', 'EN_PROCESO'), true);
  assert.equal(transicionPermitida('RESUELTO', 'PENDIENTE'), true);
});