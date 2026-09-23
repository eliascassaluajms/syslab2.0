import { peticion } from './api';
import type {
  TrabajoGradoDetalleMovil,
  TrabajoGradoListaRespuesta,
  TrabajoGradoResumenMovil,
} from '../types/defensa';
import { obtenerToken } from './storage';

export interface FiltrosMisTrabajos {
  solosMios?: boolean;
  estado?: string;
  gestion?: number;
  carreraId?: number;
}

export async function listarMisTrabajos(token: string, filtros: FiltrosMisTrabajos = {}): Promise<TrabajoGradoResumenMovil[]> {
  const query = new URLSearchParams();
  if (filtros.solosMios) query.set('soloMios', 'true');
  if (filtros.estado) query.set('estado', filtros.estado);
  if (filtros.gestion) query.set('gestion', String(filtros.gestion));
  if (filtros.carreraId) query.set('carreraId', String(filtros.carreraId));

  const respuesta = await peticion<TrabajoGradoListaRespuesta>({
    metodo: 'GET',
    ruta: `/api/defensas/trabajos${query.size ? `?${query.toString()}` : ''}`,
    token,
  });
  return respuesta.data;
}

export async function obtenerDetalleTrabajo(token: string, trabajoId: string): Promise<TrabajoGradoDetalleMovil> {
  const respuesta = await peticion<{ status: string; data: TrabajoGradoDetalleMovil }>({
    metodo: 'GET',
    ruta: `/api/defensas/trabajos/${trabajoId}`,
    token,
  });
  return respuesta.data;
}

export interface ObservacionNuevaPayload {
  designacionId: string;
  detalleObservacion?: string;
  esExtraordinaria?: boolean;
}

export async function registrarObservacion(
  token: string,
  trabajoId: string,
  payload: ObservacionNuevaPayload,
  archivo?: { uri: string; nombre: string; tipo: string; tamanio?: number },
): Promise<void> {
  const formData = new FormData();
  formData.append('designacionId', String(payload.designacionId));
  formData.append('detalleObservacion', payload.detalleObservacion ?? '');
  formData.append('esExtraordinaria', String(payload.esExtraordinaria === true));
  if (archivo) {
    formData.append('archivo', {
      uri: archivo.uri,
      name: archivo.nombre,
      type: archivo.tipo,
    } as unknown as Blob);
  }

  await peticion<{ status: string; data: unknown }>({
    metodo: 'POST',
    ruta: `/api/defensas/trabajos/${trabajoId}/observaciones`,
    token,
    cuerpo: formData,
  });
}

export async function emitirConformidad(token: string, trabajoId: string, designacionId: string): Promise<void> {
  await peticion<{ status: string; data: unknown }>({
    metodo: 'POST',
    ruta: `/api/defensas/trabajos/${trabajoId}/conformidad`,
    token,
    cuerpo: { designacionId },
  });
}
