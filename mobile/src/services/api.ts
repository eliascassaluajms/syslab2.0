import type { ApiErrorBody } from '../types/api';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly body?: ApiErrorBody,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const extraerMensajeError = (body: ApiErrorBody | undefined, fallback: string): string =>
  body?.message || body?.error || fallback;

const obtenerUrlBase = async (): Promise<string> => {
  const { obtenerApiUrl } = await import('./storage');
  const url = await obtenerApiUrl();
  return url.replace(/\/+$/, '');
};

interface Peticion {
  metodo: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  ruta: string;
  cuerpo?: unknown;
  token?: string;
}

export async function peticion<T>({ metodo, ruta, cuerpo, token }: Peticion): Promise<T> {
  const urlBase = await obtenerUrlBase();

  let respuesta: Response;
  try {
    respuesta = await fetch(`${urlBase}${ruta}`, {
      method: metodo,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined,
    });
  } catch {
    throw new ApiError(
      'No se pudo conectar con el servidor. Verifique la URL configurada y su conexión a internet.',
      0,
    );
  }

  let body: ApiErrorBody | undefined;
  try {
    body = (await respuesta.json()) as ApiErrorBody;
  } catch {
    body = undefined;
  }

  if (!respuesta.ok) {
    throw new ApiError(extraerMensajeError(body, `Error del servidor (${respuesta.status}).`), respuesta.status, body);
  }

  return body as T;
}