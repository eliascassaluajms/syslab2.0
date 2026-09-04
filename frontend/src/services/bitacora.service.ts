import { httpClient } from './httpClient';

export interface IniciarSesionDTO {
  laboratorioId: number;
  materiaId?: number;
  docenteId?: number;
  nombreAyudante?: string;
  materiaNombre?: string;
  tipoUso: 'REGULAR' | 'EXTRAORDINARIO';
  solicitudExtraordinariaId?: number;
  practicaRealizada?: string;
}

export interface SesionActivaResponse {
  id: number;
  laboratorioId: number;
  tokenQR: string;
  fecha: string;
  horaInicio: string;
  laboratorio?: { nombre: string };
  materia?: { nombre: string; sigla?: string };
  docente?: { nombre: string; apellido?: string };
  totalAsistentes?: number;
}

export interface AsistenteItem {
  id?: number;
  fechaHora?: string | null;
  estado?: 'PRESENTE' | 'ATRASO' | 'LICENCIA' | 'FALTA';
  origen?: string;
  justificativo?: string | null;
  equipo?: { id: number; nombre: string; codigoPatrimonial?: string | null } | null;
  estudiante?: {
    id: number;
    nombre: string;
    apellido?: string;
    correo?: string;
  };
  nombreCompleto?: string;
}

export interface AsistentesSesionResponse {
  total: number;
  asistentes: AsistenteItem[];
}

export interface ListaConsolidadaResponse {
  sesion: SesionActivaResponse;
  listaConfirmada: boolean;
  totalInscritos: number;
  presentes: number;
  atrasos: number;
  licencias: number;
  faltas: number;
  estudiantes: Array<AsistenteItem & { estudiante: NonNullable<AsistenteItem['estudiante']>; asistenciaId: number | null }>;
}

export const bitacoraService = {
  // Iniciar clase y obtener el token QR generado
  iniciarSesion: async (datos: IniciarSesionDTO): Promise<SesionActivaResponse> => {
    const response = await httpClient.post('/bitacora/iniciar', datos);
    const resData = response.data;
    return resData?.data?.sesion || resData?.data || resData;
  },

  // Finalizar clase y registrar la práctica realizada
  finalizarSesion: async (id: number, practicaRealizada: string, cumplio: boolean = true) => {
    const response = await httpClient.patch(`/bitacora/${id}/finalizar`, {
      practicaRealizada,
      cumplio,
    });
    return response.data;
  },

  // Consultar conteo y lista de estudiantes registrados en tiempo real (Polling)
  obtenerAsistentesSesion: async (sesionId: number): Promise<AsistentesSesionResponse> => {
    const response = await httpClient.get(`/bitacora/${sesionId}/asistentes`);
    const resData = response.data;
    if (resData && typeof resData.data === 'object' && resData.data !== null) {
      return {
        total: resData.data.total ?? (Array.isArray(resData.data.asistentes) ? resData.data.asistentes.length : 0),
        asistentes: resData.data.asistentes || [],
      };
    }
    if (Array.isArray(resData)) {
      return {
        total: resData.length,
        asistentes: resData,
      };
    }
    return {
      total: resData?.total || 0,
      asistentes: resData?.asistentes || [],
    };
  },

  obtenerListaConsolidada: async (sesionId: number): Promise<ListaConsolidadaResponse> => {
    const response = await httpClient.get(`/bitacora/${sesionId}/asistencia`);
    return response.data?.data || response.data;
  },

  actualizarAsistencia: async (sesionId: number, estudianteId: number, datos: {
    estado: 'PRESENTE' | 'ATRASO' | 'LICENCIA' | 'FALTA';
    justificativo?: string;
    equipoId?: number;
  }) => {
    const response = await httpClient.put(`/bitacora/${sesionId}/asistencia/${estudianteId}`, datos);
    return response.data?.data?.asistencia || response.data?.data || response.data;
  },

  confirmarAsistencia: async (sesionId: number): Promise<ListaConsolidadaResponse> => {
    const response = await httpClient.post(`/bitacora/${sesionId}/confirmar-asistencia`);
    return response.data?.data || response.data;
  },

  // Consultar si hay una sesión activa para un laboratorio
  obtenerSesionActiva: async (laboratorioId: number): Promise<SesionActivaResponse | null> => {
    try {
      const response = await httpClient.get('/bitacora/activa', {
        params: { laboratorioId },
      });
      const resData = response.data;
      return resData?.data?.sesion || resData?.data || resData || null;
    } catch {
      return null;
    }
  },

  // Descargar Planilla de Control y Asistencia en PDF
  descargarPdf: async (sesionId: number, nombreArchivo: string = 'Planilla_Bitacora.pdf'): Promise<void> => {
    const response = await httpClient.get(`/bitacora/${sesionId}/asistencia-pdf`, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', nombreArchivo);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};
