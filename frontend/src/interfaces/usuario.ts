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

export interface UsuarioLista {
  id: number;
  nombre: string;
  correo: string;
  activo: boolean;
  roles?: RolSimple[];
  rol?: RolSimple;
  usuarioFacultades?: UsuarioFacultad[];
  usuarioCarreras?: UsuarioCarrera[];
  facultades?: number[];
  carreras?: number[];
}