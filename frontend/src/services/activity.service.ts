import { httpClient } from './httpClient';
import { Activity } from '../interfaces/activity.interface';

// Asumimos el endpoint primario de SysLab basado en REST estándar
const ENDPOINT = '/activities';

export const getActivities = async (soloActivos?: boolean) => {
  const queryParam = soloActivos ? '?soloActivos=true' : '';
  const response = await httpClient.get(`${ENDPOINT}${queryParam}`);
  // Prevención de errores de iteración (.map is not a function)
  return response.data?.data || response.data;
};

export async function createActivity(data: any): Promise<Activity> {
  const response = await httpClient.post(ENDPOINT, data);
  return response.data?.data || response.data;
}

export async function updateActivity(id: string | number, data: any): Promise<Activity> {
  const response = await httpClient.put(`${ENDPOINT}/${id}`, data);
  return response.data?.data || response.data;
}

export async function cambiarEstado(id: string | number, activo: boolean): Promise<Activity> {
  const response = await httpClient.patch(`${ENDPOINT}/${id}/estado`, { activo });
  return response.data?.data || response.data;
}

export async function deleteActivity(id: string | number): Promise<any> {
  const response = await httpClient.delete(`${ENDPOINT}/${id}`);
  return response.data?.data || response.data;
}

export const activityService = {
  listar: getActivities,
  crear: createActivity,
  actualizar: updateActivity,
  cambiarEstado,
  eliminar: deleteActivity
};

export const ActivityService = activityService;
export default activityService;
