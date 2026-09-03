import { httpClient } from './httpClient';
import { Activity } from '../interfaces/activity.interface';

export const getActivities = async (soloActivos?: boolean) => {
  const queryParam = soloActivos ? '?soloActivos=true' : '';
  try {
    const response = await httpClient.get(`/activities${queryParam}`);
    return response.data;
  } catch (error: any) {
    try {
      const response = await httpClient.get(`/actividades${queryParam}`);
      return response.data;
    } catch (err: any) {
      const detalleError = error.response?.data || { message: 'Error de conexión con el servidor' };
      console.error('Fallo en API /activities:', detalleError);
      throw detalleError;
    }
  }
};

export async function createActivity(data: any): Promise<Activity> {
  try {
    const response = await httpClient.post('/actividades', data);
    return response.data;
  } catch (err) {
    const response = await httpClient.post('/activities', data);
    return response.data;
  }
}

export async function updateActivity(id: string | number, data: any): Promise<Activity> {
  try {
    const response = await httpClient.put(`/activities/${id}`, data);
    return response.data;
  } catch (err) {
    const response = await httpClient.put(`/actividades/${id}`, data);
    return response.data;
  }
}

export async function cambiarEstado(id: string | number, activo: boolean): Promise<Activity> {
  try {
    const response = await httpClient.patch(`/activities/${id}/estado`, { activo });
    return response.data;
  } catch (err) {
    const response = await httpClient.patch(`/actividades/${id}/estado`, { activo });
    return response.data;
  }
}

export async function deleteActivity(id: string | number): Promise<any> {
  try {
    const response = await httpClient.delete(`/activities/${id}`);
    return response.data;
  } catch (err) {
    const response = await httpClient.delete(`/actividades/${id}`);
    return response.data;
  }
}

export const activityService = {
  listar: getActivities,
  crear: createActivity,
  actualizar: updateActivity,
  cambiarEstado,
  eliminar: deleteActivity
};

export default activityService;
