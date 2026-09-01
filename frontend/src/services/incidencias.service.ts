import { httpClient } from './httpClient';
import {
  IncidenciaItem,
  IncidenciaConteos,
  CrearIncidenciaPayload,
  GestionarIncidenciaPayload,
  FiltrosIncidencia,
} from '../interfaces/incidencia.interface';

export interface IncidenciasListarResponse {
  status: string;
  data: {
    incidencias: IncidenciaItem[];
    conteos: IncidenciaConteos;
  };
}

export interface IncidenciaCrearResponse {
  status: string;
  message: string;
  data: {
    incidencia: IncidenciaItem;
  };
}

export interface IncidenciaGestionarResponse {
  status: string;
  message: string;
  data: {
    incidencia: IncidenciaItem;
  };
}

export const incidenciasService = {
  async listar(filtros?: FiltrosIncidencia): Promise<IncidenciasListarResponse['data']> {
    const params: Record<string, any> = {};
    if (filtros?.estado) params.estado = filtros.estado;
    if (filtros?.prioridad) params.prioridad = filtros.prioridad;
    if (filtros?.laboratorioId) params.laboratorioId = filtros.laboratorioId;

    const { data } = await httpClient.get<IncidenciasListarResponse>('/incidencias', { params });
    return data.data;
  },

  async crear(payload: CrearIncidenciaPayload): Promise<IncidenciaItem> {
    const { data } = await httpClient.post<IncidenciaCrearResponse>('/incidencias', payload);
    return data.data.incidencia;
  },

  async gestionar(id: number, payload: GestionarIncidenciaPayload): Promise<IncidenciaItem> {
    const { data } = await httpClient.patch<IncidenciaGestionarResponse>(`/incidencias/${id}/gestionar`, payload);
    return data.data.incidencia;
  },
};

export default incidenciasService;
