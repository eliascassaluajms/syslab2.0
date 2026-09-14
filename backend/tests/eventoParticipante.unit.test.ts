import test from 'node:test';
import assert from 'node:assert/strict';

import {
  validarCodigoTransaccion,
  sanitizarNombrePropio,
  sanitizarCorreo,
  calcularMontoEsperado,
  validarVigenciaActividad,
} from '../src/services/participanteEvento.service.js';

test('Fase 1 (Unitario) - Validación de Códigos de Transacción Bancaria', async (t) => {
  await t.test('acepta transacciones válidas estrictamente numéricas entre 6 y 25 dígitos', () => {
    assert.equal(validarCodigoTransaccion('10142826090907258247'), true);
    assert.equal(validarCodigoTransaccion('123456'), true);
    assert.equal(validarCodigoTransaccion('9876543210123456789012345'), true);
    assert.equal(validarCodigoTransaccion(' 10142826090907258247 '), true, 'debe tolerar espacios periféricos');
  });

  await t.test('rechaza transacciones con letras, caracteres especiales o formatos corruptos', () => {
    assert.equal(validarCodigoTransaccion('101428ABC909072'), false);
    assert.equal(validarCodigoTransaccion('1014-2826-0909'), false);
    assert.equal(validarCodigoTransaccion('1014 2826 0909'), false);
    assert.equal(validarCodigoTransaccion('TRANSAC#9999'), false);
    assert.equal(validarCodigoTransaccion('<script>alert(1)</script>'), false);
  });

  await t.test('rechaza transacciones que no cumplen la longitud de 6 a 25 caracteres', () => {
    assert.equal(validarCodigoTransaccion('12345'), false, '5 dígitos es menor a 6');
    assert.equal(validarCodigoTransaccion('1'), false);
    assert.equal(validarCodigoTransaccion('12345678901234567890123456'), false, '26 dígitos excede el límite');
    assert.equal(validarCodigoTransaccion(''), false);
    assert.equal(validarCodigoTransaccion(null), false);
    assert.equal(validarCodigoTransaccion(undefined), false);
  });
});

test('Fase 1 (Unitario) - Sanitización de Entradas de Datos Personales', async (t) => {
  await t.test('sanitizarNombrePropio formatea a tipo Título y elimina espacios redundantes', () => {
    assert.equal(sanitizarNombrePropio('jorge aleman'), 'Jorge Aleman');
    assert.equal(sanitizarNombrePropio('  MARIA   ELENA  RODRIGUEZ  '), 'Maria Elena Rodriguez');
    assert.equal(sanitizarNombrePropio('élida baldiviezo'), 'Élida Baldiviezo');
    assert.equal(sanitizarNombrePropio(''), '');
    assert.equal(sanitizarNombrePropio(null), '');
  });

  await t.test('sanitizarCorreo limpia espacios y estandariza a minúsculas', () => {
    assert.equal(sanitizarCorreo('  Jorge.Aleman@Uajms.Edu.Bo  '), 'jorge.aleman@uajms.edu.bo');
    assert.equal(sanitizarCorreo('PARTICIPANTE@GMAIL.COM'), 'participante@gmail.com');
    assert.equal(sanitizarCorreo(''), '');
    assert.equal(sanitizarCorreo(null), '');
  });
});

test('Fase 1 (Unitario) - Cálculo y Verificación de Montos por Categoría', async (t) => {
  const tarifasConfig = {
    costoEstudiante: 80,
    costoProfesional: 120,
    costoGeneral: 100,
  };

  await t.test('calcula correctamente la tarifa para ESTUDIANTE', () => {
    const monto = calcularMontoEsperado('ESTUDIANTE', tarifasConfig);
    assert.equal(monto, 80);
  });

  await t.test('calcula correctamente la tarifa para PROFESIONAL y DOCENTE', () => {
    assert.equal(calcularMontoEsperado('PROFESIONAL', tarifasConfig), 120);
    assert.equal(calcularMontoEsperado('DOCENTE', tarifasConfig), 120);
  });

  await t.test('utiliza valores por defecto seguros si la configuración no provee tarifas', () => {
    assert.equal(calcularMontoEsperado('ESTUDIANTE', null), 80);
    assert.equal(calcularMontoEsperado('PROFESIONAL', null), 120);
    assert.equal(calcularMontoEsperado('OTRO', null), 100);
  });
});

test('Fase 1 (Unitario) - Validación de Vigencia Temporal de Actividades', async (t) => {
  await t.test('actividad inactiva siempre es rechazada', () => {
    const resultado = validarVigenciaActividad(new Date('2030-01-01'), false);
    assert.equal(resultado.valido, false);
    assert.match(resultado.motivo || '', /inactiva/i);
  });

  await t.test('actividad con fecha límite vencida es rechazada', () => {
    const ayer = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const resultado = validarVigenciaActividad(ayer, true);
    assert.equal(resultado.valido, false);
    assert.match(resultado.motivo || '', /expirado/i);
  });

  await t.test('actividad activa con fecha futura es aceptada', () => {
    const proximoMes = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const resultado = validarVigenciaActividad(proximoMes, true);
    assert.equal(resultado.valido, true);
  });
});
