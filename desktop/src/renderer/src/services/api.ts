import type { EquipoVinculado, EstadoDesafio, RespuestaDesafio } from '../../../shared/types';

interface RespuestaApi<T> {
  status: string;
  data: T;
}

class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly detalle?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function registrarDispositivo(
  apiUrl: string,
  authToken: string,
  datos: { codigoPatrimonial: string; laboratorioId: number; nombreEquipo?: string },
): Promise<EquipoVinculado> {
  const res = await fetch(`${apiUrl.replace(/\/$/, '')}/api/desktop/registrar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify(datos),
  });

  if (!res.ok) {
    throw await errorDeRespuesta(res);
  }

  const body = (await res.json()) as RespuestaApi<EquipoVinculado>;
  return body.data;
}

export async function bloquearEquipo(apiUrl: string, deviceToken: string): Promise<RespuestaDesafio> {
  const res = await fetch(`${apiUrl.replace(/\/$/, '')}/api/desktop/bloquear`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-device-token': deviceToken },
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    throw await errorDeRespuesta(res);
  }

  const body = (await res.json()) as RespuestaApi<RespuestaDesafio>;
  return body.data;
}

export async function consultarDesafio(
  apiUrl: string,
  deviceToken: string,
  desafioId: number,
): Promise<EstadoDesafio> {
  const res = await fetch(`${apiUrl.replace(/\/$/, '')}/api/desktop/desafio/${desafioId}`, {
    headers: { 'x-device-token': deviceToken },
  });

  if (!res.ok) {
    throw await errorDeRespuesta(res);
  }

  const body = (await res.json()) as RespuestaApi<EstadoDesafio>;
  return body.data;
}

export function construirPayloadQR(desafio: RespuestaDesafio): string {
  return JSON.stringify({
    d: desafio.desafioId,
    c: desafio.codigo,
    l: desafio.laboratorio.id,
  });
}

async function errorDeRespuesta(res: Response): Promise<ApiError> {
  try {
    const body = (await res.json()) as { message?: string; error?: string };
    return new ApiError(body.message || body.error || `Error del servidor (${res.status}).`, res.status, body);
  } catch {
    return new ApiError(`No se pudo conectar con el servidor (${res.status}).`, res.status);
  }
}

export async function probarConexion(apiUrl: string): Promise<boolean> {
  try {
    const res = await fetch(`${apiUrl.replace(/\/$/, '')}/api/health`, { method: 'GET' });
    return res.ok;
  } catch {
    return false;
  }
}