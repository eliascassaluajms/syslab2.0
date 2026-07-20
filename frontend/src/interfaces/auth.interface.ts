export interface Usuario {
  id: number | string;
  nombre: string;
  correo: string;
  rol: string;
  activo?: boolean;
  
  // ⚡ Atributos de ámbitos y permisos resueltos por el JWT
  ambitos?: string[];
  permisos?: string[];  // Ej: ['usuarios:crear', 'laboratorios:editar']
  carreras?: number[];  // Ej: [1, 2]
  facultades?: number[];
}

export interface AuthContextType {
  user: Usuario | null;
  loading: boolean;
  login: (correo: string, password: string) => Promise<void>;
  logout: () => void;
}