export type TipoParticipante = 'ESTUDIANTE' | 'PROFESIONAL';
export type EstadoInscripcion = 'PRE_INSCRITO' | 'PAGO_VERIFICADO' | 'RECHAZADO' | 'ASISTENCIA_CONFIRMADA';

export interface EventoParticipante {
  id: string;
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  tipo: TipoParticipante;
  estado: EstadoInscripcion;
  activityId?: string | null;
  codigoTransaccion?: string | null;
  comprobanteUrl?: string | null;
  observaciones?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EventoPaymentConfig {
  id: string;
  banco: string;
  numeroCuenta: string;
  nombreReceptor: string;
  nitCI?: string | null;
  qrImagenUrl: string;
  activo: boolean;
}

export interface RegistrarParticipanteDTO {
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  tipo: TipoParticipante;
  activityId?: string;
  codigoTransaccion?: string;
  comprobanteUrl?: string;
}
