import test from 'node:test';
import assert from 'node:assert/strict';

import { haySolapamientoHorario, validarNoConflictoHorario } from '../src/services/horario.service.js';

test('detecta solapamiento entre horarios en el mismo laboratorio, día y hora', () => {
  assert.equal(
    haySolapamientoHorario('08:00', '10:00', '09:00', '11:00'),
    true,
  );

  assert.equal(
    haySolapamientoHorario('08:00', '10:00', '10:00', '12:00'),
    false,
  );
});

test('rechaza un horario que cruza con otra asignación del mismo docente o laboratorio', () => {
  const conflicto = validarNoConflictoHorario({
    laboratorioId: 5,
    docenteId: 12,
    diaSemana: 'Lunes',
    horaInicio: '09:00',
    horaFin: '11:00',
    horarioExistente: [{
      id: 7,
      laboratorioId: 5,
      docenteId: 12,
      diaSemana: 'Lunes',
      horaInicio: '10:00',
      horaFin: '12:00',
      grupo: 1,
      totalGrupos: 1,
      materiaId: 3,
    }],
  });

  assert.equal(conflicto, false);
});

test('acepta horarios no superpuestos en el mismo día', () => {
  const conflicto = validarNoConflictoHorario({
    laboratorioId: 5,
    docenteId: 12,
    diaSemana: 'Martes',
    horaInicio: '08:00',
    horaFin: '10:00',
    horarioExistente: [{
      id: 7,
      laboratorioId: 5,
      docenteId: 12,
      diaSemana: 'Martes',
      horaInicio: '10:00',
      horaFin: '12:00',
      grupo: 1,
      totalGrupos: 1,
      materiaId: 3,
    }],
  });

  assert.equal(conflicto, true);
});
