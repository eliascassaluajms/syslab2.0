import { EstadoIncidencia, PrioridadIncidencia, TipoIncidencia, CategoriaEquipoIncidencia } from '@prisma/client';

export interface CrearIncidenciaDTO {
  clienteUuid?: string;
  laboratorioId: number;
  solicitanteId: number;
  equipos?: Array<{ equipoId: number }>;
  equipoId?: number | null;
  titulo: string;
  descripcion: string;
  tipo?: TipoIncidencia;
  categoriaEquipo?: CategoriaEquipoIncidencia;
  prioridad?: PrioridadIncidencia;
}

export interface GestionarIncidenciaDTO {
  estado?: EstadoIncidencia;
  tecnicoId?: number | null;
  solucion?: string | null;
  prioridad?: PrioridadIncidencia;
  tipo?: TipoIncidencia;
  categoriaEquipo?: CategoriaEquipoIncidencia;
}

export interface AgregarNotaDTO {
  incidenciaId: number;
  autorId: number | null;
  mensaje: string;
}

export type ActualizarEstadoIncidenciaDTO = GestionarIncidenciaDTO;

export interface FiltrosIncidenciaDTO {
  estado?: EstadoIncidencia;
  laboratorioId?: number;
  prioridad?: PrioridadIncidencia;
  solicitanteId?: number;
  equipoId?: number;
  tecnicoId?: number;
  tipo?: TipoIncidencia;
}