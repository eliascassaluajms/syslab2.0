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
  montoPagado?: number | string;
  montoBancoReal?: number | string | null;
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
  montoPagado?: number;
  comprobanteUrl?: string;
  observaciones?: string;
}

export interface ResultadoOCRResponse {
  status: 'success' | 'fail' | 'error';
  valido: boolean;
  codigoTransaccion?: string;
  monto?: number | null;
  comprobanteUrl: string;
  advertencia?: string;
  datosOcr?: {
    codigoTransaccion?: string;
    monto?: number | null;
    comprobanteUrl: string;
    rawText?: string;
  };
  message?: string;
}

export interface EliminarComprobanteTemporalDTO {
  comprobanteUrl: string;
}

export interface EliminarComprobanteResponse {
  status: 'success' | 'fail' | 'error';
  eliminado: boolean;
  message: string;
}

