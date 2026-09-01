import { CategoriaActivo, EstadoActivo } from '@prisma/client';

export interface CrearEquipoDTO {
  laboratorioId: number;
  codigoPatrimonial?: string | null;
  nombre: string;
  categoria?: CategoriaActivo;
  estado?: EstadoActivo;
  marca?: string | null;
  modelo?: string | null;
  numeroSerie?: string | null;
  ubicacionDetalle?: string | null;
  descripcion?: string | null;
  especificaciones?: Record<string, unknown> | null;
  fechaAdquisicion?: Date | null;
}

export interface ActualizarEquipoDTO {
  laboratorioId?: number;
  codigoPatrimonial?: string | null;
  nombre?: string;
  categoria?: CategoriaActivo;
  estado?: EstadoActivo;
  marca?: string | null;
  modelo?: string | null;
  numeroSerie?: string | null;
  ubicacionDetalle?: string | null;
  descripcion?: string | null;
  especificaciones?: Record<string, unknown> | null;
}

export interface FiltrosEquipoDTO {
  laboratorioId?: number;
  categoria?: CategoriaActivo;
  estado?: EstadoActivo;
  busqueda?: string;
}
