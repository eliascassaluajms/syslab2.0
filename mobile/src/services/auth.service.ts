import { peticion } from './api';
import type { LoginRespuesta, UsuarioSesion } from '../types/api';

export async function login(identificador: string, password: string): Promise<{ token: string; usuario: UsuarioSesion }> {
  const esRu = /^\d+$/.test(identificador);
  const respuesta = await peticion<LoginRespuesta>({
    metodo: 'POST',
    ruta: '/api/auth/login',
    cuerpo: esRu ? { ru: identificador, password } : { correo: identificador, password },
  });

  return { token: respuesta.token, usuario: respuesta.data.usuario };
}