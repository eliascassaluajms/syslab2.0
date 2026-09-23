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
  _esReintento?: boolean;
}

let promesaRefrescoEnVuelo: Promise<string | null> | null = null;

async function intentarRefrescarToken(urlBase: string): Promise<string | null> {
  const { obtenerRefreshToken, guardarToken, guardarRefreshToken, eliminarSesion } = await import('./storage');
  const refreshToken = await obtenerRefreshToken();

  if (!refreshToken) {
    await eliminarSesion();
    return null;
  }

  try {
    const res = await fetch(`${urlBase}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      await eliminarSesion();
      return null;
    }

    const json: any = await res.json();
    const nuevoToken = json.token;
    const nuevoRefresh = json.refreshToken;

    if (nuevoToken) {
      await guardarToken(nuevoToken);
      if (nuevoRefresh) {
        await guardarRefreshToken(nuevoRefresh);
      }
      return nuevoToken;
    }

    await eliminarSesion();
    return null;
  } catch {
    return null;
  }
}

export async function peticion<T>({ metodo, ruta, cuerpo, token, _esReintento }: Peticion): Promise<T> {
  const urlBase = await obtenerUrlBase();
  const esFormData = typeof FormData !== 'undefined' && cuerpo instanceof FormData;

  let respuesta: Response;
  try {
    respuesta = await fetch(`${urlBase}${ruta}`, {
      method: metodo,
      headers: {
        ...(esFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: cuerpo !== undefined ? (esFormData ? (cuerpo as unknown as BodyInit) : JSON.stringify(cuerpo)) : undefined,
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

  // Interceptar 401 si no es endpoint de autenticación y no fue un reintento
  const esRutaAuth = ruta.includes('/auth/login') || ruta.includes('/auth/refresh') || ruta.includes('/auth/logout');
  if (respuesta.status === 401 && !esRutaAuth && !_esReintento) {
    if (!promesaRefrescoEnVuelo) {
      promesaRefrescoEnVuelo = intentarRefrescarToken(urlBase).finally(() => {
        promesaRefrescoEnVuelo = null;
      });
    }

    const nuevoToken = await promesaRefrescoEnVuelo;
    if (nuevoToken) {
      return peticion<T>({
        metodo,
        ruta,
        cuerpo,
        token: nuevoToken,
        _esReintento: true,
      });
    }
  }

  if (!respuesta.ok) {
    throw new ApiError(extraerMensajeError(body, `Error del servidor (${respuesta.status}).`), respuesta.status, body);
  }

  return body as T;
}