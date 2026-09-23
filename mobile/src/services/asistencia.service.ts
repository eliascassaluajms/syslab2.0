import { peticion } from './api';
import type { AsistenciaRespuesta } from '../types/api';

export async function marcarAsistencia(
  token: string,
  tokenQR: string,
  codigoEquipoPatrimonial?: string,
): Promise<AsistenciaRespuesta['data']> {
  const respuesta = await peticion<AsistenciaRespuesta>({
    metodo: 'POST',
    ruta: '/api/bitacora/marcar-asistencia',
    cuerpo: {
      tokenQR,
      ...(codigoEquipoPatrimonial ? { codigoEquipoPatrimonial } : {}),
    },
    token,
  });
  return respuesta.data;
}