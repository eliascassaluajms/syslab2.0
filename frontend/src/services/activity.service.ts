import { Activity } from '../interfaces/activity.interface';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export async function getActivities(): Promise<Activity[]> {
  const res = await fetch(`${API_URL}/activities`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  });
  if (!res.ok) throw new Error('Error al cargar las actividades');
  return res.json();
}

export async function createActivity(data: { title: string; description?: string; careerScope: string; labId: number }): Promise<Activity> {
  const res = await fetch(`${API_URL}/activities`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.message || 'Error al registrar la actividad');
  }
  return res.json();
}
