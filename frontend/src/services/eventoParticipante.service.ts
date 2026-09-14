import { httpClient } from './httpClient';
import { 
  EventoParticipante, 
  RegistrarParticipanteDTO, 
  ResultadoOCRResponse, 
  EliminarComprobanteResponse,
  EventoPaymentConfig 
} from '../interfaces/eventoParticipante.interface';

export const EventoParticipanteService = {
  async listar(): Promise<EventoParticipante[]> {
    const { data } = await httpClient.get<EventoParticipante[]>('/evento-participantes');
    return data;
  },

  async registrar(payload: RegistrarParticipanteDTO): Promise<{ id: string; success: boolean; data?: EventoParticipante; message?: string }> {
    const { data } = await httpClient.post('/evento-participantes', payload);
    return data;
  },

  async procesarOCR(formData: FormData): Promise<ResultadoOCRResponse> {
    const { data } = await httpClient.post<ResultadoOCRResponse>('/evento-participantes/ocr', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  async obtenerConfiguracionPago(): Promise<EventoPaymentConfig | null> {
    try {
      const { data } = await httpClient.get<EventoPaymentConfig>('/payment-config');
      return data;
    } catch {
      try {
        const { data } = await httpClient.get<EventoPaymentConfig>('/payment-config/activo');
        return data;
      } catch {
        return null;
      }
    }
  },

  async actualizar(id: string, datos: Partial<EventoParticipante>): Promise<EventoParticipante> {
    const { data } = await httpClient.put(`/evento-participantes/${id}`, datos);
    return data;
  },

  async eliminar(id: string): Promise<{ success: boolean; message?: string }> {
    const { data } = await httpClient.delete(`/evento-participantes/${id}`);
    return data;
  },

  async validarPago(id: string, estado: string, observaciones?: string): Promise<EventoParticipante> {
    const { data } = await httpClient.patch(`/evento-participantes/${id}/validar-pago`, { estado, observaciones });
    return data;
  },

  async subirComprobante(id: string, formData: FormData): Promise<EventoParticipante> {
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
  }): Promise<EventoParticipante> {
    const { data } = await httpClient.post('/evento-participantes/matricular-manual', datos);
    return data;
  },

  async listarVerificadosPorActividad(activityId: string): Promise<EventoParticipante[]> {
    const { data } = await httpClient.get(`/evento-participantes/verificados/${activityId}`);
    return data;
  },

  async descargarVoucher(id: string): Promise<Blob> {
    const { data } = await httpClient.get(`/evento-participantes/${id}/voucher`, {
      responseType: 'blob',
    });
    return data;
  },

  async eliminarComprobanteTemporal(comprobanteUrl: string): Promise<EliminarComprobanteResponse> {
    const { data } = await httpClient.delete<EliminarComprobanteResponse>('/evento-participantes/comprobante-temp', {
      data: { comprobanteUrl },
    });
    return data;
  }
};

