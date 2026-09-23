import { app } from 'electron';
import { mkdirSync, readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';

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

const DEFAULTS: AppConfig = {
  apiUrl: 'http://localhost:5000',
  nombreEquipo: '',
  modoKiosk: true,
  bloquearOS: false,
  dispositivo: null,
};

class ConfigStore {
  private filePath: string;

  constructor() {
    this.filePath = join(app.getPath('userData'), 'syslab-config.json');
  }

  load(): AppConfig {
    try {
      const raw = readFileSync(this.filePath, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<AppConfig>;
      return { ...DEFAULTS, ...parsed };
    } catch {
      return { ...DEFAULTS };
    }
  }

  save(config: AppConfig): void {
    mkdirSync(dirname(this.filePath), { recursive: true });
    writeFileSync(this.filePath, JSON.stringify(config, null, 2), 'utf-8');
  }

  clear(): void {
    mkdirSync(dirname(this.filePath), { recursive: true });
    writeFileSync(this.filePath, JSON.stringify(DEFAULTS, null, 2), 'utf-8');
  }
}

export const configStore = new ConfigStore();