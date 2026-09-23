export interface UsuarioDefensaTribunal {
  id: number;
  nombre?: string | null;
  apellido?: string | null;
  correo?: string | null;
  rol?: { nombre: string } | null;
}

export interface TribunalDesignacionMovil {
  id: string;
  trabajoGradoId: string;
  docenteId: number;
  rol: string;
  preside: boolean;
  esExterno: boolean;
  institucionProcedencia?: string | null;
  estadoRevision: string;
  fechaLimiteObservaciones?: string | null;
  fechaConformidad?: string | null;
  numeroMemorandum?: string | null;
  cartaConformidadUrl?: string | null;
  docente?: UsuarioDefensaTribunal | null;
}

export interface VersionDocumentoMovil {
  id: string;
  numeroVersion: number;
  descripcionCambios?: string | null;
  archivoUrl?: string | null;
  fechaSubida?: string | null;
}

export interface ObservacionTribunalMovil {
  id: string;
  numeroRevision: number;
  detalleObservacion?: string | null;
  archivoCorreccionesUrl?: string | null;
  esExtraordinaria: boolean;
  subsanada?: boolean;
  creadoEn?: string | null;
  designacionId?: string | null;
}

export interface ActaDefensaMovil {
  id: string;
  codigoActa?: string | null;
  calificacionFinal?: number | null;
  resultadoFinal?: string | null;
}

export type EstadoTrabajoGradoMovil =
  | 'REGISTRADO'
  | 'TRIBUNAL_DESIGNADO'
  | 'CON_OBSERVACIONES'
  | 'APTO_PARA_DEFENSA'
  | 'DEFENSA_PROGRAMADA';

export interface TrabajoGradoResumenMovil {
  id: string;
  titulo: string;
  modalidad?: string | null;
  gradoOptado?: string | null;
  gestion: number | null;
  estado: EstadoTrabajoGradoMovil;
  estudianteNombre: string;
  estudianteApellido?: string | null;
  carrera?: { id: number; nombre: string } | null;
  tribunales?: TribunalDesignacionMovil[];
  esTribunal?: boolean;
}

export interface TrabajoGradoDetalleMovil {
  id: string;
  titulo: string;
  modalidad?: string | null;
  gradoOptado?: string | null;
  gestion: number | null;
  estado: EstadoTrabajoGradoMovil;
  estudianteNombre: string;
  estudianteCi?: string | null;
  estudianteRu?: string | null;
  estudianteEmail?: string | null;
  estudianteTelefono?: string | null;
  carrera?: { id: number; nombre: string } | null;
  tribunales?: TribunalDesignacionMovil[];
  versiones?: VersionDocumentoMovil[];
  observaciones?: ObservacionTribunalMovil[];
  acta?: ActaDefensaMovil | null;
}

export interface TrabajoGradoRespuesta<T> {
  status: string;
  data: T;
}

export interface TrabajoGradoListaRespuesta {
  status: string;
  results: number;
  data: TrabajoGradoResumenMovil[];
}

/** Construye el nombre visible de un tribunal (interno o externo). */
export const nombreDeTribunal = (t: TribunalDesignacionMovil): string => {
  const d = t.docente;
  if (d) {
    return `${d.nombre ?? ''} ${d.apellido ?? ''}`.trim() || `Tribunal #${t.id}`;
  }
  return `Tribunal #${t.id}`;
};