import { httpClient } from './httpClient';
import { EquipoItem, EquipoConteos, GuardarEquipoPayload, FiltrosEquipo } from '../interfaces/equipo.interface';

export const equipoService = {
  async listar(filtros: FiltrosEquipo = {}): Promise<{ items: EquipoItem[]; conteos: EquipoConteos }> {
    try {
      const params: Record<string, unknown> = {};
      if (filtros.laboratorioId) params.laboratorioId = filtros.laboratorioId;
      if (filtros.categoria) params.categoria = filtros.categoria;
      if (filtros.estado) params.estado = filtros.estado;
      if (filtros.busqueda) params.busqueda = filtros.busqueda;

      const response = await httpClient.get('/equipos', { params });
      return response.data?.data || { items: [], conteos: { total: 0, operativos: 0, enMantenimiento: 0, deteriorados: 0, deBaja: 0 } };
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error al listar el inventario.');
    }
  },

  async crear(payload: GuardarEquipoPayload): Promise<EquipoItem> {
    try {
      const response = await httpClient.post('/equipos', payload);
      return response.data?.data?.equipo;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error al registrar el activo.');
    }
  },

  async actualizar(id: number, payload: Partial<GuardarEquipoPayload>): Promise<EquipoItem> {
    try {
      const response = await httpClient.put(`/equipos/${id}`, payload);
      return response.data?.data?.equipo;
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error al actualizar el activo.');
    }
  },

  async eliminar(id: number): Promise<void> {
    try {
      await httpClient.delete(`/equipos/${id}`);
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Error al eliminar el activo.');
    }
  },
};
