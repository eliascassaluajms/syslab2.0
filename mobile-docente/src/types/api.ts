export interface UsuarioSesion {
  id: number;
  nombre: string;
  apellido: string;
  username: string;
  correo: string;
  esGlobal?: boolean;
  rol?: string;
  roles?: string[];
  permisos?: string[];
  carreraId?: number | null;
}

export interface LoginRespuesta {
  status: string;
  token: string;
  refreshToken?: string;
  data: { usuario: UsuarioSesion };
}

export interface Horario {
  id: number;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
  grupo: number;
  totalGrupos?: number;
  semestre?: number;
  gestion?: number;
  laboratorio: { id: number; nombre: string; codigo: string };
  materia: { id: number; nombre: string; codigo: string };
  docente: { id: number; nombre: string; apellido: string };
}

export interface HorariosRespuesta {
  status: string;
  results: number;
  data: { horarios: Horario[] };
}

export interface AsistenciaRespuesta {
  status: string;
  message: string;
  data: {
    asistenciaId: number;
    estudiante: string;
    ru: string;
    estado: string;
    fechaHora: string;
    equipo?: string | null;
    materia?: string | null;
    grupo?: number | null;
  };
}

export interface DesafioQR {
  d: number;
  c: string;
  l: number;
}

export interface RespuestaLiberar {
  status: string;
  message: string;
  data: {
    desafioId: number;
    estado: string;
    usoEquipoId?: number;
    equipo: { id: number; codigoPatrimonial: string; nombre: string | null };
    laboratorio: { id: number; nombre: string };
    sesion?: {
      sesionId: number;
      materia: string;
      grupo: number;
      listaConfirmada: boolean;
    } | null;
    asistencia?: {
      asistenciaId: number;
      estado: string;
      sesionId: number;
      materia: string;
    } | null;
  };
}

export interface ApiErrorBody {
  status?: string;
  message?: string;
  error?: string;
  errors?: unknown;
}

export interface SesionBitacora {
  id: number;
  laboratorioId: number;
  laboratorio: { id: number; nombre: string; codigo: string; ubicacion: string | null };
  materiaId: number | null;
  materia: { id: number; nombre: string; codigo: string; semestre: number } | null;
  docenteId: number | null;
  docente: { id: number; username: string; nombre: string; apellido: string; correo: string } | null;
  nombreAyudante: string | null;
  materiaNombre: string | null;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  practicaRealizada: string | null;
  cumplio: boolean;
  tipoUso: string;
  grupo: number;
  semestre: number;
  gestion: number;
  listaConfirmada: boolean;
  fechaConfirmacionLista: string | null;
  tokenQR: string;
  asistencias?: Array<{
    id: number;
    estudianteId: number;
    estado: string;
    fechaHora: string | null;
    justificativo: string | null;
    equipo: { id: number; nombre: string | null; codigoPatrimonial: string } | null;
    estudiante: { id: number; username: string; nombre: string; apellido: string; correo: string };
  }>;
  createdAt?: string;
}

export interface SesionesRespuesta {
  status: string;
  results: number;
  data: { sesiones: SesionBitacora[]; bitacoras: SesionBitacora[] };
}

export interface IniciarRespuesta {
  status: string;
  data: { sesion: SesionBitacora };
}

export type EstadoAsistencia = 'PRESENTE' | 'ATRASO' | 'LICENCIA' | 'FALTA';

export interface NominaItem {
  estudianteId: number;
  ru: string;
  nombre: string;
  apellido: string;
  nombreCompleto: string;
  correo: string;
  grupo: number;
  semestre: number;
  marcado: boolean;
  estadoAsistencia: EstadoAsistencia | 'FALTA';
  fechaHora: string | null;
  equipo: string | null;
}

export interface NominaRespuesta {
  status: string;
  results: number;
  data: { nomina: NominaItem[] };
}

export interface EstudiantesLista {
  estudiante: { id: number; nombre: string; apellido: string; correo: string; username: string };
  nombreCompleto: string;
  estado: EstadoAsistencia;
  origen: string;
  justificativo: string | null;
  equipo: { id: number; nombre: string | null; codigoPatrimonial: string } | null;
  fechaHora: string | null;
  asistenciaId: number | null;
}

export interface ListaConsolidada {
  sesion: SesionBitacora;
  listaConfirmada: boolean;
  totalInscritos: number;
  presentes: number;
  atrasos: number;
  licencias: number;
  faltas: number;
  estudiantes: EstudiantesLista[];
}