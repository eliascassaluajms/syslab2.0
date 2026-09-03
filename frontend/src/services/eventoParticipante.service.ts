import { httpClient } from './httpClient';

export const EventoParticipanteService = {
  async listar() {
    const { data } = await httpClient.get('/evento-participantes');
    return data;
  },

  async actualizar(id: string, datos: any) {
    const { data } = await httpClient.put(`/evento-participantes/${id}`, datos);
    return data;
  },

  async eliminar(id: string) {
    const { data } = await httpClient.delete(`/evento-participantes/${id}`);
    return data;
  },

  async validarPago(id: string, estado: string, observaciones?: string) {
    const { data } = await httpClient.patch(`/evento-participantes/${id}/validar-pago`, { estado, observaciones });
    return data;
  },

  async subirComprobante(id: string, formData: FormData) {
    const { data } = await httpClient.post(`/evento-participantes/${id}/comprobante`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async matricularManual(datos: {
    nombre: string;
    apellido: string;
    correo: string;
    telefono: string;
    tipo: string;
    activityId: string;
    codigoTransaccion?: string;
    estadoPago?: string;
    observaciones?: string;
  }) {
    const { data } = await httpClient.post('/evento-participantes/matricular-manual', datos);
    return data;
  },

  async listarVerificadosPorActividad(activityId: string) {
    const { data } = await httpClient.get(`/evento-participantes/verificados/${activityId}`);
    return data;
  }
};
