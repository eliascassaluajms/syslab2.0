export interface Rol {
  id?: number;
  nombre: string;
  permisos?: string[];
}

export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol?: string | Rol;
  roles?: (string | Rol)[];
  permisos?: string[];
  carreraId?: number;
  carreras?: number[];
  esGlobal?: boolean;
}

export interface AuthContextType {
  user: Usuario | null;
  loading: boolean;
  login: (correo: string, password: string) => Promise<void>;
  logout: () => void;
  tienePermiso: (permiso: string) => boolean;
}