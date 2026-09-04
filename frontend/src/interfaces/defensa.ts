export type EstadoTrabajoDefensa =
  | 'REGISTRADO'
  | 'TRIBUNAL_DESIGNADO'
  | 'CON_OBSERVACIONES'
  | 'APTO_PARA_DEFENSA'
  | 'DEFENSA_PROGRAMADA';

export interface TrabajoGradoResumen {
  id: string;
  titulo: string;
  modalidad?: string;
  gradoOptado?: string;
  carreraId?: number;
  estudianteNombre: string;
  estudianteCi?: string;
  estudianteRu?: string;
  estudianteEmail?: string;
  estudianteTelefono?: string | null;
  estado: EstadoTrabajoDefensa;
  creadoEn?: string;
  tribunales?: Array<{
    id: string;
    rol: 'PRESIDENTE' | 'SECRETARIO' | 'VOCAL';
    docente?: {
      id: number;
      nombre: string;
      apellido?: string;
      correo?: string;
    };
  }>;
  carrera?: {
    id: number;
    nombre: string;
  };
}

export interface CrearTrabajoGradoPayload {
  titulo: string;
  modalidad: string;
  gradoOptado: string;
  carreraId: number;
  estudianteNombre: string;
  estudianteCi: string;
  estudianteRu: string;
  estudianteEmail: string;
  estudianteTelefono?: string;
}

export interface TribunalAsignacionPayload {
  docenteId: number;
  rol: 'PRESIDENTE' | 'SECRETARIO' | 'VOCAL';
  esExterno?: boolean;
  institucionProcedencia?: string;
}
