export type EstadoIncidenciaMovil =
  | 'PENDIENTE'
  | 'EN_REVISION'
  | 'EN_PROCESO'
  | 'RESUELTO'
  | 'DESCARTADO';

export type PrioridadIncidenciaMovil = 'BAJA' | 'MEDIA' | 'ALTA' | 'CRITICA';
export type TipoIncidenciaMovil = 'HARDWARE' | 'SOFTWARE' | 'RED' | 'INFRAESTRUCTURA';
export type CategoriaEquipoIncidenciaMovil =
  | 'PC'
  | 'PROYECTOR'
  | 'AIRE_ACONDICIONADO'
  | 'RED_INTERNET'
  | 'PERIFERICO'
  | 'SOFTWARE'
  | 'OTRO';

export interface IncidenciaNotaMovil {
  id: number;
  mensaje: string;
  esSistema: boolean;
  fecha: string;
  autor?: { id: number; nombre: string; apellido?: string } | null;
}

export interface IncidenciaMovil {
  id: number;
  folio: string;
  laboratorioId: number;
  tipo: TipoIncidenciaMovil;
  categoriaEquipo: CategoriaEquipoIncidenciaMovil;
  titulo: string;
  descripcion: string;
  prioridad: PrioridadIncidenciaMovil;
  estado: EstadoIncidenciaMovil;
  solucion?: string | null;
  evidenciaUrl?: string | null;
  fechaReporte: string;
  fechaResolucion?: string | null;
  laboratorio?: { id: number; nombre: string };
  solicitante?: { id: number; nombre: string; apellido?: string; correo: string };
  tecnicoAsignado?: { id: number; nombre: string; apellido?: string } | null;
  equipo?: { id: number; codigoInventario?: string; codigoPatrimonial?: string; nombre: string } | null;
}

export interface IncidenciaConteosMovil {
  total: number;
  pendientes: number;
  enProceso: number;
  resueltas: number;
  descartadas?: number;
}

export interface IncidenciaDetalleMovil extends IncidenciaMovil {
  notas: IncidenciaNotaMovil[];
}

export interface IncidenciaListaRespuesta {
  status: string;
  data: { incidencias: IncidenciaMovil[]; conteos: IncidenciaConteosMovil };
}

export interface IncidenciaDetalleRespuesta {
  status: string;
  data: { incidencia: IncidenciaDetalleMovil };
}

export interface IncidenciaCreadaRespuesta {
  status: string;
  data: { incidencia: IncidenciaMovil };
}

export interface CrearIncidenciaInputMovil {
  clienteUuid?: string;
  laboratorioId: number;
  equipoId?: number | null;
  titulo: string;
  descripcion: string;
  tipo: TipoIncidenciaMovil;
  categoriaEquipo: CategoriaEquipoIncidenciaMovil;
  prioridad: PrioridadIncidenciaMovil;
}

export interface LaboratorioOpcionMovil {
  id: number;
  nombre: string;
  codigo?: string | null;
}

export interface EquipoOpcionMovil {
  id: number;
  nombre: string;
  codigoPatrimonial?: string | null;
}

export interface EquiposListaRespuesta {
  status: string;
  data: { items: Array<EquipoOpcionMovil & { estado?: string; categoria?: string }> };
}

export interface LaboratoriosActivosRespuesta {
  status: string;
  data: { materias: unknown[]; laboratorios: LaboratorioOpcionMovil[] };
}