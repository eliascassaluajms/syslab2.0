import { peticion } from './api';
import type {
  ListaConsolidada,
  NominaItem,
  NominaRespuesta,
  SesionBitacora,
  SesionesRespuesta,
} from '../types/api';

export interface IniciarSesionInput {
  laboratorioId: number;
  materiaId?: number;
  materiaNombre?: string;
  tipoUso?: string;
  practicaRealizada?: string;
}

export async function listarSesiones(token: string): Promise<SesionBitacora[]> {
  const respuesta = await peticion<SesionesRespuesta>({
    metodo: 'GET',
    ruta: '/api/bitacora',
    token,
  });
  return respuesta.data.sesiones;
}

export async function iniciarSesion(token: string, datos: IniciarSesionInput): Promise<SesionBitacora> {
  const respuesta = await peticion<{ status: string; data: { sesion: SesionBitacora } }>({
    metodo: 'POST',
    ruta: '/api/bitacora/iniciar',
    cuerpo: datos,
    token,
  });
  return respuesta.data.sesion;
}

export async function finalizarSesion(
  token: string,
  id: number,
  datos: { practicaRealizada?: string; cumplio?: boolean },
): Promise<SesionBitacora> {
  const respuesta = await peticion<{ status: string; data: { sesion: SesionBitacora } }>({
    metodo: 'PATCH',
    ruta: `/api/bitacora/${id}/finalizar`,
    cuerpo: datos,
    token,
  });
  return respuesta.data.sesion;
}

export async function obtenerNomina(token: string, sesionId: number): Promise<NominaItem[]> {
  const respuesta = await peticion<NominaRespuesta>({
    metodo: 'GET',
    ruta: `/api/bitacora/${sesionId}/nomina`,
    token,
  });
  return respuesta.data.nomina;
}

export async function obtenerListaConsolidada(token: string, sesionId: number): Promise<ListaConsolidada> {
  const respuesta = await peticion<{ status: string; data: ListaConsolidada }>({
    metodo: 'GET',
    ruta: `/api/bitacora/${sesionId}/lista`,
    token,
  });
  return respuesta.data;
}

export async function actualizarAsistencia(
  token: string,
  sesionId: number,
  estudianteId: number,
  estado: string,
  justificativo?: string,
): Promise<void> {
  await peticion<{ status: string }>({
    metodo: 'PUT',
    ruta: `/api/bitacora/${sesionId}/asistencia/${estudianteId}`,
    cuerpo: { estado, ...(justificativo ? { justificativo } : {}) },
    token,
  });
}

export async function confirmarAsistencia(token: string, sesionId: number): Promise<ListaConsolidada> {
  const respuesta = await peticion<{ status: string; data: ListaConsolidada }>({
    metodo: 'POST',
    ruta: `/api/bitacora/${sesionId}/confirmar-asistencia`,
    token,
  });
  return respuesta.data;
}