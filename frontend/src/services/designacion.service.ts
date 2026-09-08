import { httpClient } from './httpClient';
import { DesignacionMateria, CrearDesignacionDTO } from '../interfaces/designacion.interface';

export const DesignacionService = {
  async listar(gestion: number): Promise<DesignacionMateria[]> {
    const response = await httpClient.get(`/designaciones?gestion=${gestion}`);
    return response.data.data;
  },

  async crear(data: CrearDesignacionDTO): Promise<DesignacionMateria> {
    const response = await httpClient.post('/designaciones', data);
    return response.data.data;
  },

  async eliminar(id: number): Promise<void> {
    await httpClient.delete(`/designaciones/${id}`);
  }
};
