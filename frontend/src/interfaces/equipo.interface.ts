export type CategoriaActivo =
  | 'COMPUTO'
  | 'RED_COMUNICACION'
  | 'MUEBLES_ENSERES'
  | 'HERRAMIENTAS_INSTRUMENTOS'
  | 'AUDIOVISUAL'
  | 'OTRO';

export type EstadoActivo = 'OPERATIVO' | 'EN_MANTENIMIENTO' | 'DETERIORADO' | 'DE_BAJA';

export interface EquipoItem {
  id: number;
  laboratorioId: number;
  codigoPatrimonial?: string | null;
  nombre: string;
  categoria: CategoriaActivo;
  estado: EstadoActivo;
  marca?: string | null;
  modelo?: string | null;
  numeroSerie?: string | null;
  ubicacionDetalle?: string | null;
  descripcion?: string | null;
  createdAt: string;
  laboratorio?: { id: number; nombre: string };
  _count?: { incidencias: number };
}

export interface EquipoConteos {
  total: number;
  operativos: number;
  enMantenimiento: number;
  deteriorados: number;
  deBaja: number;
}

export interface GuardarEquipoPayload {
  laboratorioId: number;
  codigoPatrimonial?: string | null;
  nombre: string;
  categoria: CategoriaActivo;
  estado: EstadoActivo;
  marca?: string | null;
  modelo?: string | null;
  numeroSerie?: string | null;
  ubicacionDetalle?: string | null;
  descripcion?: string | null;
}

export interface FiltrosEquipo {
  laboratorioId?: number | '';
  categoria?: string;
  estado?: string;
  busqueda?: string;
}
