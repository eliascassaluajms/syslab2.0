import { httpClient } from './httpClient';
import { Activity } from '../interfaces/activity.interface';

export const getActivities = async () => {
  try {
    const response = await httpClient.get('/activities');
    return response.data;
  } catch (error: any) {
    // Extrae el mensaje de error estructurado del servidor si existe
    const detalleError = error.response?.data || { message: 'Error de conexión con el servidor' };
    console.error('Fallo en API /activities:', detalleError);
    throw detalleError;
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

export const activityService = {
  listar: getActivities,
  crear: createActivity
};
