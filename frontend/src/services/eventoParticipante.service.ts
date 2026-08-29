import { httpClient } from './httpClient';
import { EventoPaymentConfig, RegistrarParticipanteDTO, EventoParticipante } from '../interfaces/eventoParticipante.interface';

export const EventoParticipanteService = {
  async obtenerConfiguracionPago(): Promise<EventoPaymentConfig> {
    const response = await httpClient.get('/evento/pago-config');
    return response.data.data;
  },

  async registrar(data: RegistrarParticipanteDTO): Promise<EventoParticipante> {
    const response = await httpClient.post('/evento/registro', data);
    return response.data.data;
  },

  async listarParticipantes(): Promise<EventoParticipante[]> {
    const response = await httpClient.get('/evento/participantes');
    return response.data.data;
  }
};
