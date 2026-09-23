import { peticion } from './api';
import type {
  CrearIncidenciaInputMovil,
  EquipoOpcionMovil,
  EquiposListaRespuesta,
  IncidenciaCreadaRespuesta,
  IncidenciaDetalleMovil,
  IncidenciaDetalleRespuesta,
  IncidenciaListaRespuesta,
  IncidenciaMovil,
  IncidenciaConteosMovil,
  LaboratorioOpcionMovil,
  LaboratoriosActivosRespuesta,
} from '../types/incidencia';

export interface FiltrosMisIncidencias {
  estado?: string;
}

interface LaboratoriosListaRespuesta {
  status: string;
  data: { laboratorios: LaboratorioOpcionMovil[] };
}

export async function listarMisIncidencias(
  token: string,
  filtros: FiltrosMisIncidencias = {},
): Promise<{ incidencias: IncidenciaMovil[]; conteos: IncidenciaConteosMovil }> {
  const query = filtros.estado ? `?estado=${encodeURIComponent(filtros.estado)}` : '';
  const respuesta = await peticion<IncidenciaListaRespuesta>({
    metodo: 'GET',
    ruta: `/api/incidencias/mis-reportes${query}`,
    token,
  });
  return respuesta.data;
}

export async function obtenerDetalleIncidencia(token: string, incidenciaId: number): Promise<IncidenciaDetalleMovil> {
  const respuesta = await peticion<IncidenciaDetalleRespuesta>({
    metodo: 'GET',
    ruta: `/api/incidencias/${incidenciaId}`,
    token,
  });
  return respuesta.data.incidencia;
}

export async function crearIncidencia(token: string, datos: CrearIncidenciaInputMovil): Promise<IncidenciaMovil> {
  const respuesta = await peticion<IncidenciaCreadaRespuesta>({
    metodo: 'POST',
    ruta: '/api/incidencias',
    cuerpo: datos,
    token,
  });
  return respuesta.data.incidencia;
}

export async function agregarNotaIncidencia(token: string, incidenciaId: number, mensaje: string): Promise<void> {
  await peticion<{ status: string }>({
    metodo: 'POST',
    ruta: `/api/incidencias/${incidenciaId}/notas`,
    cuerpo: { mensaje },
    token,
  });
}

export async function subirEvidenciaIncidencia(
  token: string,
  incidenciaId: number,
  archivo: { uri: string; nombre: string; tipo: string },
): Promise<{ evidenciaUrl: string }> {
  const formData = new FormData();
  formData.append('evidencia', {
    uri: archivo.uri,
    name: archivo.nombre,
    type: archivo.tipo,
  } as unknown as Blob);

  const respuesta = await peticion<{ status: string; data: { evidenciaUrl: string } }>({
    metodo: 'POST',
    ruta: `/api/incidencias/${incidenciaId}/evidencia`,
    token,
    cuerpo: formData,
  });
  return respuesta.data;
}

export async function listarLaboratorios(token: string): Promise<LaboratorioOpcionMovil[]> {
  const respuesta = await peticion<LaboratoriosListaRespuesta>({
    metodo: 'GET',
    ruta: '/api/laboratorios',
    token,
  });
  return respuesta.data.laboratorios ?? [];
}

export async function obtenerLaboratoriosActivos(token: string): Promise<LaboratorioOpcionMovil[]> {
  try {
    const respuesta = await peticion<LaboratoriosActivosRespuesta>({
      metodo: 'GET',
      ruta: '/api/laboratorios/mis-horarios-activos',
      token,
    });
    return respuesta.data.laboratorios ?? [];
  } catch {
    return [];
  }
}

export async function listarEquipos(token: string, laboratorioId: number): Promise<EquipoOpcionMovil[]> {
  const respuesta = await peticion<EquiposListaRespuesta>({
    metodo: 'GET',
    ruta: `/api/equipos?laboratorioId=${laboratorioId}`,
    token,
  });
  const items = respuesta.data.items ?? [];
  return items
    .filter((e) => e.estado !== 'DE_BAJA')
    .map((e) => ({ id: e.id, nombre: e.nombre, codigoPatrimonial: e.codigoPatrimonial }));
}