export enum EstadoSolicitud {
  PENDIENTE = 'PENDIENTE',
  APROBADO = 'APROBADO',
  RECHAZADO = 'RECHAZADO',
}

export interface LaboratorioDisponible {
  id: number;
  nombre: string;
  codigo?: string;
  capacidad: number;
  ubicacion?: string;
}

export interface CrearSolicitudExtraordinariaDTO {
  laboratorioId: number;
  docenteId?: number;
  solicitadoPorDirector: boolean;
  nombreAyudante?: string;
  materia: string;
  fecha: string; // YYYY-MM-DD
  horaInicio: string; // HH:mm
  horaFin: string; // HH:mm
  motivo: string;
}

export interface SolicitudExtraordinaria extends CrearSolicitudExtraordinariaDTO {
  id: number;
  estado: EstadoSolicitud;
  createdAt: string;
  laboratorio?: {
    nombre: string;
  };
  docente?: {
    nombre: string;
    apellido?: string;
  };
}
