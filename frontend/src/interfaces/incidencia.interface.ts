export type EstadoIncidencia = 'PENDIENTE' | 'EN_REVISION' | 'EN_PROCESO' | 'RESUELTO' | 'DESCARTADO';
export type PrioridadIncidencia = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
export type TipoIncidencia = 'HARDWARE' | 'SOFTWARE' | 'RED' | 'INFRAESTRUCTURA';
export type CategoriaEquipoIncidencia =
  | 'PC'
  | 'PROYECTOR'
  | 'AIRE_ACONDICIONADO'
  | 'RED_INTERNET'
  | 'PERIFERICO'
  | 'SOFTWARE'
  | 'OTRO';

export interface IncidenciaNota {
  id: number;
  mensaje: string;
  esSistema: boolean;
  fecha: string;
  autor?: { id: number; nombre: string; apellido?: string } | null;
}

export interface IncidenciaItem {
  id: number;
  folio: string;
  laboratorioId: number;
  solicitanteId: number;
  tecnicoId?: number | null;
  equipoId?: number | null;
  tipo: TipoIncidencia;
  categoriaEquipo: CategoriaEquipoIncidencia;
  titulo: string;
  descripcion: string;
  prioridad: PrioridadIncidencia;
  estado: EstadoIncidencia;
  solucion?: string | null;
  evidenciaUrl?: string | null;
  fechaReporte: string;
  fechaResolucion?: string | null;
  laboratorio?: { id: number; nombre: string };
  solicitante?: { id: number; nombre: string; apellido?: string; correo: string };
  tecnicoAsignado?: { id: number; nombre: string; apellido?: string } | null;
  equipo?: { id: number; codigoInventario?: string; codigoPatrimonial?: string; nombre: string } | null;
}

export interface IncidenciaDetalle extends IncidenciaItem {
  notas: IncidenciaNota[];
}

export interface IncidenciaConteos {
  total: number;
  pendientes: number;
  enProceso: number;
  resueltas: number;
  descartadas?: number;
}

export interface CrearIncidenciaPayload {
  clienteUuid?: string;
  laboratorioId: number;
  equipoId?: number | null;
  titulo: string;
  descripcion: string;
  tipo: TipoIncidencia;
  categoriaEquipo: CategoriaEquipoIncidencia;
  prioridad: PrioridadIncidencia;
}

export interface GestionarIncidenciaPayload {
  estado?: EstadoIncidencia;
  tecnicoId?: number | null;
  solucion?: string | null;
  prioridad?: PrioridadIncidencia;
  tipo?: TipoIncidencia;
  categoriaEquipo?: CategoriaEquipoIncidencia;
}

export interface FiltrosIncidencia {
  estado?: string;
  laboratorioId?: number | '';
  prioridad?: string;
  tipo?: string;
}