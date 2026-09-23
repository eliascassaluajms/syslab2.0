import { httpClient } from './httpClient';
import {
  AsignacionTribunalesResultado,
  ControlMemorandum,
  CrearTrabajoGradoPayload,
  FiltrosListarTrabajos,
  TrabajoGradoResumen,
  TribunalAsignacionPayload,
} from '../interfaces/defensa';

const extraerData = <T>(response: any): T => {
  return (response?.data?.data ?? response?.data ?? response) as T;
};

export const defensasService = {
  async listarTrabajos(filtros: FiltrosListarTrabajos = {}): Promise<TrabajoGradoResumen[]> {
    const response = await httpClient.get('/defensas/trabajos', { params: filtros });
    return extraerData<TrabajoGradoResumen[]>(response);
  },

  async listarMisTrabajos(): Promise<TrabajoGradoResumen[]> {
    const response = await httpClient.get('/defensas/mis-trabajos');
    return extraerData<TrabajoGradoResumen[]>(response);
  },

  async obtenerPorId(id: string): Promise<TrabajoGradoResumen> {
    const response = await httpClient.get(`/defensas/trabajos/${id}`);
    return extraerData<TrabajoGradoResumen>(response);
  },

  async crear(payload: CrearTrabajoGradoPayload): Promise<TrabajoGradoResumen> {
    const response = await httpClient.post('/defensas/trabajos', payload);
    return extraerData<TrabajoGradoResumen>(response);
  },

  async actualizar(id: string, payload: Partial<CrearTrabajoGradoPayload>): Promise<TrabajoGradoResumen> {
    const response = await httpClient.put(`/defensas/trabajos/${id}`, payload);
    return extraerData<TrabajoGradoResumen>(response);
  },

  async eliminar(id: string): Promise<{ eliminado: boolean }> {
    const response = await httpClient.delete(`/defensas/trabajos/${id}`);
    return extraerData<{ eliminado: boolean }>(response);
  },

  async asignarTribunales(
    trabajoId: string,
    tribunales: TribunalAsignacionPayload[]
  ): Promise<AsignacionTribunalesResultado> {
    const response = await httpClient.post(`/defensas/trabajos/${trabajoId}/tribunales`, { tribunales });
    return extraerData<AsignacionTribunalesResultado>(response);
  },

  async registrarVersion(
    trabajoId: string,
    options: { archivo?: File | null; archivoUrl?: string; descripcionCambios?: string }
  ): Promise<unknown> {
    if (options.archivo) {
      const formData = new FormData();
      formData.append('archivo', options.archivo);
      if (options.descripcionCambios) formData.append('descripcionCambios', options.descripcionCambios);
      const response = await httpClient.post(`/defensas/trabajos/${trabajoId}/versiones`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return extraerData(response);
    }

    const response = await httpClient.post(`/defensas/trabajos/${trabajoId}/versiones`, {
      archivoUrl: options.archivoUrl,
      descripcionCambios: options.descripcionCambios,
    });
    return extraerData(response);
  },

  async registrarObservacion(
    trabajoId: string,
    payload: {
      designacionId: string;
      detalleObservacion?: string;
      archivo?: File | null;
      archivoCorreccionesUrl?: string;
      esExtraordinaria?: boolean;
    }
  ): Promise<unknown> {
    if (payload.archivo) {
      const formData = new FormData();
      formData.append('designacionId', payload.designacionId);
      if (payload.detalleObservacion) formData.append('detalleObservacion', payload.detalleObservacion);
      formData.append('esExtraordinaria', String(payload.esExtraordinaria === true));
      formData.append('archivo', payload.archivo);
      const response = await httpClient.post(`/defensas/trabajos/${trabajoId}/observaciones`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return extraerData(response);
    }

    const response = await httpClient.post(`/defensas/trabajos/${trabajoId}/observaciones`, {
      designacionId: payload.designacionId,
      detalleObservacion: payload.detalleObservacion,
      archivoCorreccionesUrl: payload.archivoCorreccionesUrl,
      esExtraordinaria: payload.esExtraordinaria === true,
    });
    return extraerData(response);
  },

  async emitirConformidad(trabajoId: string, designacionId: string): Promise<unknown> {
    const response = await httpClient.post(`/defensas/trabajos/${trabajoId}/conformidad`, { designacionId });
    return extraerData(response);
  },

  async actualizarFechaLimite(trabajoId: string, designacionId: string, fechaLimite: string): Promise<unknown> {
    const response = await httpClient.put(`/defensas/trabajos/${trabajoId}/tribunales/fecha-limite`, {
      designacionId,
      fechaLimite,
    });
    return extraerData(response);
  },

  async generarActa(trabajoId: string): Promise<unknown> {
    const response = await httpClient.get(`/defensas/trabajos/${trabajoId}/acta`);
    return extraerData(response);
  },

  actaPdfUrl(trabajoId: string): string {
    return `/defensas/trabajos/${trabajoId}/acta-pdf`;
  },

  memorandumPdfUrl(trabajoId: string, tribunalId: string): string {
    return `/defensas/trabajos/${trabajoId}/memorandums/${tribunalId}/pdf`;
  },

  async obtenerControlMemorandum(carreraId: number, gestion: number): Promise<ControlMemorandum> {
    const response = await httpClient.get('/defensas/control-memorandum', { params: { carreraId, gestion } });
    return extraerData<ControlMemorandum>(response);
  },

  async actualizarControlMemorandum(
    carreraId: number,
    gestion: number,
    ultimoNumero: number
  ): Promise<ControlMemorandum> {
    const response = await httpClient.put('/defensas/control-memorandum', { carreraId, gestion, ultimoNumero });
    return extraerData<ControlMemorandum>(response);
  },
};