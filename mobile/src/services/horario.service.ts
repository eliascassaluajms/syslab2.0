import { peticion } from './api';
import type { HorariosRespuesta } from '../types/api';

export async function obtenerMiHorario(token: string): Promise<HorariosRespuesta['data']['horarios']> {
  const respuesta = await peticion<HorariosRespuesta>({
    metodo: 'GET',
    ruta: '/api/horarios/mi-horario',
    token,
  });
  return respuesta.data.horarios;
}