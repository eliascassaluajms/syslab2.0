import { useState, useEffect, useCallback } from 'react';
import { httpClient } from '../services/httpClient';

export interface RolSimple {
  id: number;
  nombre: string;
}

// Interfaz para la entidad de Usuario dentro de la grilla de administración
export interface UsuarioLista {
  id: number;
  nombre: string;
  apellido?: string;
  username?: string;
  correo: string;
  activo: boolean;
  createdAt?: string;
  roles: RolSimple[];
  rol?: RolSimple;
  facultades?: number[];
  carreras?: number[];
  usuarioFacultades?: {
    facultadId: number;
    facultad?: {
      id: number;
      nombre: string;
    };
  }[];
  usuarioCarreras?: {
    carreraId: number;
    carrera?: {
      id: number;
      nombre: string;
    };
  }[];
}

export interface ActualizarPerfilPayload {
  nombre?: string;
  apellido?: string;
  correo?: string;
  rolIds?: number[];
  rolId?: number; 
  activo?: boolean;
  facultades?: number[];
  carreras?: number[];
}

export interface CrearUsuarioDatosBasicosPayload {
  nombre: string;
  apellido: string;
  correo: string;
  password?: string;
  rolIds?: number[];
  rolId?: number;
}

/**
 * Custom Hook de Control Operativo de Usuarios
 */
export const useUsuarios = () => {
  const [usuarios, setUsuarios] = useState<UsuarioLista[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Obtener todos los usuarios registrados
  const cargarUsuarios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await httpClient.get('/usuarios');
      setUsuarios(response.data.data || []);
    } catch (err: any) {
      const mensaje = err.response?.data?.message || err.message || 'Error al obtener la lista de usuarios.';
      setError(mensaje);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarUsuarios();
  }, [cargarUsuarios]);

  const actualizarUsuario = async (id: number, payload: ActualizarPerfilPayload) => {
    setError(null);
    try {
      await httpClient.put(`/usuarios/${id}`, payload);
      await cargarUsuarios();
    } catch (err: any) {
      const mensaje = err.response?.data?.message || err.message || 'Error al actualizar el usuario y sus ámbitos.';
      setError(mensaje);
      throw new Error(mensaje);
    }
  };

  const cambiarEstado = async (id: number, activo: boolean) => {
    setError(null);
    try {
      await httpClient.patch(`/usuarios/${id}/estado`, { activo });
      setUsuarios((prev) =>
        prev.map((user) => (user.id === id ? { ...user, activo } : user))
      );
    } catch (err: any) {
      const mensaje = err.response?.data?.message || err.message || 'Error al cambiar el estado del usuario.';
      setError(mensaje);
      throw new Error(mensaje);
    }
  };

  const cambiarPassword = async (id: number, nuevaPassword: string) => {
    setError(null);
    try {
      const res = await httpClient.patch(`/usuarios/${id}/password`, { nuevaPassword });
      return res.data;
    } catch (err: any) {
      const mensaje = err.response?.data?.message || err.message || 'Error al actualizar la contraseña.';
      setError(mensaje);
      throw new Error(mensaje);
    }
  };

  const crearUsuarioBasico = async (payload: CrearUsuarioDatosBasicosPayload) => {
    setError(null);
    try {
      const res = await httpClient.post('/usuarios', payload);
      await cargarUsuarios();
      return res.data;
    } catch (err: any) {
      const mensaje = err.response?.data?.message || err.message || 'Error al registrar usuario.';
      setError(mensaje);
      throw new Error(mensaje);
    }
  };

  return {
    usuarios,
    loading,
    error,
    cargarUsuarios,
    actualizarUsuario,
    cambiarEstado,
    cambiarPassword,
    crearUsuarioBasico,
  };
};