export interface EquipoVinculado {
  dispositivoId: number;
  deviceToken: string;
  equipo: {
    id: number;
    codigoPatrimonial: string;
    nombre: string | null;
  };
  laboratorio: {
    id: number;
    nombre: string;
  };
}

export interface AppConfig {
  apiUrl: string;
  nombreEquipo: string;
  modoKiosk: boolean;
  bloquearOS: boolean;
  dispositivo: EquipoVinculado | null;
}

export interface SistemaInfo {
  hostname: string;
  plataforma: NodeJS.Platform;
  arquitectura: string;
  usuario: string;
}

export interface RespuestaDesafio {
  desafioId: number;
  codigo: string;
  expiraEn: string;
  equipo: { id: number; codigoPatrimonial: string; nombre: string | null };
  laboratorio: { id: number; nombre: string };
}

export interface EstadoDesafio {
  desafioId: number;
  estado: 'ESPERANDO' | 'LIBERADO' | 'EXPIRADO' | 'CANCELADO';
  expiraEn: string;
  tiempoRestanteMs: number;
  equipo: { id: number; codigoPatrimonial: string; nombre: string | null };
  laboratorio: { id: number; nombre: string };
}

export interface SyslabLockAPI {
  loadConfig(): Promise<AppConfig>;
  saveConfig(config: AppConfig): Promise<void>;
  clearConfig(): Promise<void>;
  getSistemaInfo(): Promise<SistemaInfo>;
  setKiosk(enabled: boolean): Promise<boolean>;
  bloquearOS(): Promise<string>;
}