import { httpClient } from './httpClient';
import {
  IncidenciaItem,
  IncidenciaConteos,
  CrearIncidenciaPayload,
  GestionarIncidenciaPayload,
  FiltrosIncidencia,
} from '../interfaces/incidencia.interface';

export const incidenciaService = {
  async listar(filtros: FiltrosIncidencia = {}): Promise<{ incidencias: IncidenciaItem[]; conteos: IncidenciaConteos }> {
    try {
      const params: Record<string, unknown> = {};
      if (filtros.estado) params.estado = filtros.estado;
      if (filtros.laboratorioId) params.laboratorioId = filtros.laboratorioId;
      if (filtros.prioridad) params.prioridad = filtros.prioridad;

      const response = await httpClient.get('/incidencias', { params });
      return (
        response.data?.data || {
          incidencias: [],
          conteos: { total: 0, pendientes: 0, enProceso: 0, resueltas: 0 },
        }
      );
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error al obtener el listado de incidencias.');
    }
  },

  async crear(payload: CrearIncidenciaPayload): Promise<IncidenciaItem> {
    try {
      const response = await httpClient.post('/incidencias', payload);
      return response.data?.data?.incidencia;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error al registrar la incidencia.');
    }
  },

  async gestionar(id: number, payload: GestionarIncidenciaPayload): Promise<IncidenciaItem> {
    try {
      const response = await httpClient.patch(`/incidencias/${id}/gestionar`, payload);
      return response.data?.data?.incidencia;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error al actualizar el estado de la incidencia.');
    }
  },
};

export default incidenciaService;
