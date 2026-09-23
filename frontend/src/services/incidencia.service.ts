import { httpClient } from './httpClient';
import {
  IncidenciaItem,
  IncidenciaDetalle,
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
      if (filtros.tipo) params.tipo = filtros.tipo;

      const response = await httpClient.get('/incidencias', { params });
      return (
        response.data?.data || {
          incidencias: [],
          conteos: { total: 0, pendientes: 0, enProceso: 0, resueltas: 0, descartadas: 0 },
        }
      );
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error al obtener el listado de incidencias.');
    }
  },

  async listarMisReportes(estado?: string): Promise<{ incidencias: IncidenciaItem[]; conteos: IncidenciaConteos }> {
    try {
      const params: Record<string, unknown> = {};
      if (estado) params.estado = estado;

      const response = await httpClient.get('/incidencias/mis-reportes', { params });
      return (
        response.data?.data || {
          incidencias: [],
          conteos: { total: 0, pendientes: 0, enProceso: 0, resueltas: 0, descartadas: 0 },
        }
      );
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error al obtener mis reportes de incidencias.');
    }
  },

  async obtenerPorId(id: number): Promise<IncidenciaDetalle> {
    try {
      const response = await httpClient.get(`/incidencias/${id}`);
      return response.data?.data?.incidencia;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error al obtener el detalle de la incidencia.');
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

  async agregarNota(id: number, mensaje: string): Promise<void> {
    try {
      await httpClient.post(`/incidencias/${id}/notas`, { mensaje });
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error al agregar la nota.');
    }
  },

  async subirEvidencia(id: number, archivo: File): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('evidencia', archivo);
      const response = await httpClient.post(`/incidencias/${id}/evidencia`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data?.data?.evidenciaUrl || '';
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error al adjuntar la evidencia.');
    }
  },
};

export default incidenciaService;