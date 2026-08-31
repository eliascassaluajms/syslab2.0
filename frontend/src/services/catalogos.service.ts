import httpClient from './httpClient';

export const catalogosService = {
  async getFacultades() {
    const { data } = await httpClient.get('/catalogos/facultades');
    return data;
  },
  async getCarreras() {
    const { data } = await httpClient.get('/catalogos/carreras');
    return data;
  },
  async crearFacultad(payload: { nombre: string; sigla: string }) {
    const { data } = await httpClient.post('/catalogos/facultades', payload);
    return data;
  },
  async crearCarrera(payload: { nombre: string; facultadId: string }) {
    const { data } = await httpClient.post('/catalogos/carreras', payload);
    return data;
  }
};

export default catalogosService;
