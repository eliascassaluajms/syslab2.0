import { EstadoIncidencia, PrioridadIncidencia } from '@prisma/client';

export interface CrearIncidenciaDTO {
  laboratorioId: number;
  solicitanteId: number;
  equipoId?: number | null;
  titulo: string;
  descripcion: string;
  prioridad?: PrioridadIncidencia;
}

export interface GestionarIncidenciaDTO {
  estado?: EstadoIncidencia;
  tecnicoId?: number | null;
  solucion?: string | null;
  prioridad?: PrioridadIncidencia;
}

export type ActualizarEstadoIncidenciaDTO = GestionarIncidenciaDTO;

export interface FiltrosIncidenciaDTO {
  estado?: EstadoIncidencia;
  laboratorioId?: number;
  prioridad?: PrioridadIncidencia;
  solicitanteId?: number;
  equipoId?: number;
  tecnicoId?: number;
}
