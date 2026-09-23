import { EstadoIncidencia } from '@prisma/client';

export const TRANSICIONES_PERMITIDAS: Record<EstadoIncidencia, EstadoIncidencia[]> = {
  PENDIENTE: ['EN_REVISION', 'EN_PROCESO', 'DESCARTADO'],
  EN_REVISION: ['EN_PROCESO', 'RESUELTO', 'DESCARTADO', 'PENDIENTE'],
  EN_PROCESO: ['RESUELTO', 'DESCARTADO', 'PENDIENTE'],
  RESUELTO: ['PENDIENTE', 'EN_PROCESO'],
  DESCARTADO: ['PENDIENTE', 'EN_REVISION'],
};

export const ESTADOS_VALIDOS = Object.keys(TRANSICIONES_PERMITIDAS) as EstadoIncidencia[];

export function transicionPermitida(
  actual: EstadoIncidencia,
  destino: EstadoIncidencia,
): boolean {
  if (!(actual in TRANSICIONES_PERMITIDAS) || !(destino in TRANSICIONES_PERMITIDAS)) {
    return false;
  }
  return actual === destino || TRANSICIONES_PERMITIDAS[actual].includes(destino);
}