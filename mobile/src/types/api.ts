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