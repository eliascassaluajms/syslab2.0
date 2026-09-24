export type EstadoTrabajoDefensa =
  | 'REGISTRADO'
  | 'TRIBUNAL_DESIGNADO'
  | 'CON_OBSERVACIONES'
  | 'APTO_PARA_DEFENSA'
  | 'DEFENSA_PROGRAMADA';

export type RolTribunal = 'PRESIDENTE' | 'SECRETARIO' | 'VOCAL' | 'TRIBUNAL';

export type EstadoRevisionTribunal = 'PENDIENTE' | 'OBSERVADO' | 'CONFORME';

export interface TribunalDesignacion {
  id: string;
  rol: RolTribunal;
  preside: boolean;
  esExterno: boolean;
  institucionProcedencia?: string | null;
  estadoRevision: EstadoRevisionTribunal;
  numeroMemorandum?: string;
  fechaEmisionMemo?: string;
  fechaLimiteObservaciones?: string | null;
  fechaConformidad?: string | null;
  cartaConformidadUrl?: string | null;
  docente?: {
    id: number;
    nombre: string;
    apellido?: string;
    correo?: string;
    rol?: { nombre: string } | null;
  };
}

export interface VersionDocumento {
  id: string;
  numeroVersion: number;
  archivoUrl: string;
  descripcionCambios?: string | null;
  fechaSubida?: string;
}

export interface ObservacionTribunal {
  id: string;
  numeroRevision: number;
  detalleObservacion: string;
  archivoCorreccionesUrl?: string | null;
  esExtraordinaria: boolean;
  creadoEn?: string;
  designacion?: Partial<TribunalDesignacion> | null;
}

export interface ActaDefensa {
  id: string;
  codigoActa?: string;
  fechaGeneracion?: string;
}

export interface TrabajoGradoResumen {
  id: string;
  titulo: string;
  modalidad?: string | null;
  gradoOptado?: string | null;
  gestion?: number | null;
  carreraId?: number | null;
  materiaId?: number | null;
  estudianteNombre: string;
  estudianteCi?: string | null;
  estudianteRu?: string | null;
  estudianteEmail?: string | null;
  estudianteTelefono?: string | null;
  estudianteUsuarioId?: number | null;
  estado: EstadoTrabajoDefensa;
  creadoEn?: string;
  actualizadoEn?: string;
  esTribunal?: boolean;
  tribunales?: TribunalDesignacion[];
  versionesDocumento?: VersionDocumento[];
  observaciones?: ObservacionTribunal[];
  actaDefensa?: ActaDefensa | null;
  carrera?: {
    id: number;
    nombre: string;
  };
  materia?: {
    id: number;
    nombre: string;
    codigo: string;
  } | null;
}

export interface CrearTrabajoGradoPayload {
  titulo: string;
  modalidad?: string;
  gradoOptado?: string;
  gestion?: number;
  carreraId: number;
  materiaId?: number;
  estudianteNombre: string;
  estudianteCi?: string;
  estudianteRu?: string;
  estudianteEmail?: string;
  estudianteTelefono?: string;
  estudianteUsuarioId?: number;
}

export interface EstudianteElegible {
  id: number;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  correo: string;
  ru: string;
  ci: string;
  telefono?: string;
  materiaInscrita?: string;
  materiaId?: number;
  esTallerIII?: boolean;
}

export interface DocenteTribunalOption {
  id: number;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  correo: string;
  materiasEnOtrasCarreras: string[];
  tieneMateriasEnOtrasCarreras: boolean;
}

export interface TribunalAsignacionPayload {
  docenteId?: number;
  rol?: RolTribunal;
  preside?: boolean;
  esExterno?: boolean;
  nombre?: string;
  apellido?: string;
  correo?: string;
  ci?: string;
  institucionProcedencia?: string;
}

export interface CredencialTribunalExterno {
  nombre: string;
  username: string;
  password: string;
}

export interface AsignacionTribunalesResultado {
  trabajo: TrabajoGradoResumen;
  credencialesExternos: CredencialTribunalExterno[];
}

export interface ControlMemorandum {
  id?: string;
  carreraId: number;
  gestion: number;
  ultimoNumero: number;
}

export interface FiltrosListarTrabajos {
  carreraId?: number;
  gestion?: number;
  estado?: string;
  soloMios?: boolean;
}