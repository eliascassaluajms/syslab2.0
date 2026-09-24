export interface IJwtPayload {
  id: number;
  nombre: string;
  apellido?: string;
  username?: string;
  correo: string;
  esGlobal: boolean;
  rol?: string;
  roles?: string[];
  permisos?: string[];
  carreras?: number[];
  carreraId?: number | null;
  facultadId?: number | null;
}

export interface IAuthResponse {
  token: string;
  refreshToken: string;
  usuario: {
    id: number;
    nombre: string;
    apellido: string;
    username: string;
    correo: string;
    esGlobal: boolean;
    rol?: string;
    roles?: string[];
    permisos?: string[];
    carreras?: number[];
    carreraId?: number | null;
    facultadId?: number | null;
  };
}