export type EstadoIncidencia = 'PENDIENTE' | 'EN_PROCESO' | 'RESUELTO' | 'RECHAZADO';
export type PrioridadIncidencia = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';

export interface IncidenciaItem {
  id: number;
  laboratorioId: number;
  solicitanteId: number;
  tecnicoId?: number | null;
  equipoId?: number | null;
  titulo: string;
  descripcion: string;
  prioridad: PrioridadIncidencia;
  estado: EstadoIncidencia;
  solucion?: string | null;
  fechaReporte: string;
  fechaResolucion?: string | null;
  laboratorio?: { id: number; nombre: string };
  solicitante?: { id: number; nombre: string; apellido?: string; correo: string };
  tecnicoAsignado?: { id: number; nombre: string; apellido?: string } | null;
  equipo?: { id: number; codigoInventario?: string; codigoPatrimonial?: string; nombre: string } | null;
}

export interface IncidenciaConteos {
  total: number;
  pendientes: number;
  enProceso: number;
  resueltas: number;
}

export interface CrearIncidenciaPayload {
  laboratorioId: number;
  equipoId?: number | null;
  titulo: string;
  descripcion: string;
  prioridad: PrioridadIncidencia;
}

export interface GestionarIncidenciaPayload {
  estado?: EstadoIncidencia;
  tecnicoId?: number | null;
  solucion?: string | null;
  prioridad?: PrioridadIncidencia;
}

export interface FiltrosIncidencia {
  estado?: string;
  laboratorioId?: number | '';
  prioridad?: string;
}
