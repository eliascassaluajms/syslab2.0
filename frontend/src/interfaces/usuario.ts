export interface RolSimple {
  id: number;
  nombre: string;
}

export interface UsuarioFacultad {
  facultadId: number;
}

export interface UsuarioCarrera {
  carreraId: number;
}

// 🟢 Estructura completa de la asignación de ámbito perimetral que envía el backend
export interface AsignacionRolDetalle {
  id: number;
  rolId: number;
  facultadId?: number | null;
  carreraId?: number | null;
  rol?: RolSimple;
  facultad?: { id: number; nombre: string; sigla?: string } | null;
  carrera?: { id: number; nombre: string } | null;
}

export interface UsuarioLista {
  id: number;
  nombre: string;
  apellido?: string;
  username?: string;
  correo: string;
  activo: boolean;
  esGlobal?: boolean;
  roles?: RolSimple[];
  rol?: RolSimple;
  usuarioFacultades?: UsuarioFacultad[];
  usuarioCarreras?: UsuarioCarrera[];
  facultades?: number[];
  carreras?: number[];
  asignacionesRoles?: AsignacionRolDetalle[]; // 👈 Propiedad añadida aquí
}