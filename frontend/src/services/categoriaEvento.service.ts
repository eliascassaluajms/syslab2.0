import { httpClient } from './httpClient';

export enum TipoEvento {
  ACADEMICO = 'ACADEMICO',
  MANTENIMIENTO = 'MANTENIMIENTO',
  INSTITUCIONAL = 'INSTITUCIONAL',
  OTRO = 'OTRO',
}

export interface ICategoriaEvento {
  id: number;
  nombre: string;
  descripcion?: string;
  tipo: TipoEvento;
  requiereAprobacion?: boolean;
  permiteInscripcionForm?: boolean;
  activo?: boolean;
  activa?: boolean;
  estado?: string | boolean;
  facultadId?: number;
  carreraId?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ICrearCategoriaEventoDTO {
  nombre: string;
  descripcion?: string;
  tipo?: TipoEvento;
  requiereAprobacion?: boolean;
  permiteInscripcionForm?: boolean;
  facultadId?: number;
  carreraId?: number;
}

export interface IActualizarCategoriaEventoDTO {
  nombre?: string;
  descripcion?: string;
  tipo?: TipoEvento;
  requiereAprobacion?: boolean;
  permiteInscripcionForm?: boolean;
  activo?: boolean;
  estado?: boolean | string;
}

export const categoriaEventoService = {
  listar: async (facultadId?: number, carreraId?: number) => {
    const params = new URLSearchParams();
    if (facultadId) params.append('facultadId', facultadId.toString());
    if (carreraId) params.append('carreraId', carreraId.toString());
    const response = await httpClient.get<ICategoriaEvento[]>(`/actividades/categorias?${params.toString()}`);
    return response.data;
  },

  crear: async (dto: ICrearCategoriaEventoDTO) => {
    const response = await httpClient.post<ICategoriaEvento>('/actividades/categorias', dto);
    return response.data;
  },

  actualizar: async (id: number, dto: IActualizarCategoriaEventoDTO) => {
    const response = await httpClient.patch<ICategoriaEvento>(`/actividades/categorias/${id}`, dto);
    return response.data;
  },

  cambiarEstado: async (id: number, activo?: boolean) => {
    const response = await httpClient.patch<ICategoriaEvento>(`/actividades/categorias/${id}`, { activo });
    return response.data;
  },

  eliminar: async (id: number) => {
    const response = await httpClient.delete(`/actividades/categorias/${id}`);
    return response.data;
  },
};
