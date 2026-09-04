import { httpClient } from './httpClient';
import {
  LaboratorioDisponible,
  CrearSolicitudExtraordinariaDTO,
  SolicitudExtraordinaria,
  EstadoSolicitud,
} from '../interfaces/solicitudExtraordinaria.interface';

export const solicitudesExtraordinariasService = {
  // Consultar laboratorios libres en una fecha y rango de hora
  consultarDisponibilidad: async (fecha: string, horaInicio: string, horaFin: string): Promise<LaboratorioDisponible[]> => {
    const response = await httpClient.get('/horarios/disponibilidad', {
      params: { fecha, horaInicio, horaFin },
    });
    const resData = response.data;
    if (resData && Array.isArray(resData.data?.laboratorios)) {
      return resData.data.laboratorios;
    }
    if (resData && Array.isArray(resData.data)) {
      return resData.data;
    }
    if (Array.isArray(resData)) {
      return resData;
    }
    return [];
  },

  // Registrar nueva solicitud
  crear: async (datos: CrearSolicitudExtraordinariaDTO): Promise<SolicitudExtraordinaria> => {
    const response = await httpClient.post('/solicitudes-extraordinarias', datos);
    const resData = response.data;
    return resData?.data?.solicitud || resData?.data || resData;
  },

  // Listar solicitudes registradas
  listar: async (estado?: EstadoSolicitud): Promise<SolicitudExtraordinaria[]> => {
    const response = await httpClient.get('/solicitudes-extraordinarias', {
      params: { estado },
    });
    const resData = response.data;
    if (resData && Array.isArray(resData.data?.solicitudes)) {
      return resData.data.solicitudes;
    }
    if (resData && Array.isArray(resData.data)) {
      return resData.data;
    }
    if (Array.isArray(resData)) {
      return resData;
    }
    return [];
  },

  // Aprobar o rechazar solicitud (Directores / Jefes)
  cambiarEstado: async (id: number, estado: EstadoSolicitud): Promise<SolicitudExtraordinaria> => {
    const response = await httpClient.patch(`/solicitudes-extraordinarias/${id}/estado`, { estado });
    const resData = response.data;
    return resData?.data?.solicitud || resData?.data || resData;
  },
};
