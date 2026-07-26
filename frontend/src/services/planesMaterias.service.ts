// frontend/src/services/planesMaterias.service.ts
import { httpClient } from './httpClient'; 

export const planesMateriasService = {
  // --- PLANES DE ESTUDIO ---
  listarPlanesPorCarrera: async (carreraId: number) => {
    const response = await httpClient.get(`/planes-estudio/carrera/${carreraId}`);
    return response.data.data.planesEstudio;
  },

  crearPlanEstudio: async (data: { carreraId: number; gestion: number; descripcion?: string }) => {
    const response = await httpClient.post('/planes-estudio', data);
    return response.data.data.planEstudio;
  },

  actualizarPlanEstudio: async (id: number, data: { gestion?: number; descripcion?: string; activo?: boolean }) => {
    const response = await httpClient.put(`/planes-estudio/${id}`, data);
    return response.data.data.planEstudio;
  },

  eliminarPlanEstudio: async (id: number) => {
    await httpClient.delete(`/planes-estudio/${id}`);
  },

  // --- MATERIAS ---
  listarMateriasPorPlan: async (planId: number) => {
    const response = await httpClient.get(`/materias/plan/${planId}`);
    return response.data.data.materias;
  },

  crearMateria: async (data: { codigo: string; nombre: string; planId: number; tipoPeriodo?: string; semestre: number }) => {
    const response = await httpClient.post('/materias', data);
    return response.data.data.materia;
  },

  actualizarMateria: async (id: number, data: { codigo?: string; nombre?: string; tipoPeriodo?: string; semestre?: number }) => {
    const response = await httpClient.put(`/materias/${id}`, data);
    return response.data.data.materia;
  },

  eliminarMateria: async (id: number) => {
    await httpClient.delete(`/materias/${id}`);
  }
};