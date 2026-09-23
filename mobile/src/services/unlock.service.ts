import { peticion } from './api';
import type { RespuestaLiberar } from '../types/api';

export async function liberarEquipo(
  token: string,
  codigo: string,
  laboratorioId?: number,
): Promise<RespuestaLiberar['data']> {
  const respuesta = await peticion<RespuestaLiberar>({
    metodo: 'POST',
    ruta: '/api/desktop/liberar',
    cuerpo: {
      codigo,
      ...(laboratorioId !== undefined ? { laboratorioId } : {}),
    },
    token,
  });
  return respuesta.data;
}