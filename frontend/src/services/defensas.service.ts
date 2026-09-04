import { httpClient } from './httpClient';

export const defensasService = {
  async listar() {
    const response = await httpClient.get('/defensas');
    return response.data?.data || response.data || [];
  },

  async obtenerPorId(id: string) {
    const response = await httpClient.get(`/defensas/${id}`);
    return response.data?.data || response.data;
  },

  async crear(payload: Record<string, unknown>) {
    const response = await httpClient.post('/defensas', payload);
    return response.data?.data || response.data;
  },

  async registrarVersion(trabajoId: string, archivoUrl: string, descripcionCambios?: string) {
    const response = await httpClient.post(`/defensas/${trabajoId}/versiones`, { archivoUrl, descripcionCambios });
    return response.data?.data || response.data;
  },

  async registrarObservacion(trabajoId: string, designacionId: string, detalleObservacion: string) {
    const response = await httpClient.post(`/defensas/${trabajoId}/observaciones`, { designacionId, detalleObservacion });
    return response.data?.data || response.data;
  },

  async emitirConformidad(trabajoId: string, designacionId: string, cartaConformidadUrl: string) {
    const response = await httpClient.post(`/defensas/${trabajoId}/conformidad`, { designacionId, cartaConformidadUrl });
    return response.data?.data || response.data;
  },

  async generarActa(trabajoId: string) {
    const response = await httpClient.post(`/defensas/${trabajoId}/acta`);
    return response.data?.data || response.data;
  },
};
