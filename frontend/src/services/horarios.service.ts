import { httpClient } from './httpClient';

export const horariosService = {
  importarExcel: async (archivo: File) => {
    const formData = new FormData();
    formData.append('archivoExcel', archivo);
    const response = await httpClient.post('/horarios/importar-excel', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  listar: async (filters?: Record<string, string | number | undefined>) => {
    const params = new URLSearchParams();

    Object.entries(filters || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const response = await httpClient.get(`/horarios${params.toString() ? `?${params.toString()}` : ''}`);
    return response.data.data?.horarios || response.data.data || [];
  },

  crear: async (data: {
    laboratorioId: number;
    materiaId: number;
    docenteId: number;
    diaSemana: string;
    horaInicio: string;
    horaFin: string;
    semestre: number;
    gestion: number;
    grupo?: number;
    totalGrupos?: number;
  }) => {
    const response = await httpClient.post('/horarios', data);
    return response.data.data?.horario || response.data.data;
  },

  actualizar: async (id: number, data: Partial<{
    laboratorioId: number;
    materiaId: number;
    docenteId: number;
    diaSemana: string;
    horaInicio: string;
    horaFin: string;
    semestre: number;
    gestion: number;
    grupo: number;
    totalGrupos: number;
  }>) => {
    const response = await httpClient.put(`/horarios/${id}`, data);
    return response.data.data?.horario || response.data.data;
  },

  eliminar: async (id: number) => {
    await httpClient.delete(`/horarios/${id}`);
  },
};
