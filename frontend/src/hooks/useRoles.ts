import { useState, useEffect, useCallback } from 'react';
import { httpClient } from '../services/httpClient';

// Interfaz para la entidad Permiso
export interface Permiso {
  id: number;
  codigo: string;
  descripcion: string | null;
}

// Interfaz para la lista principal de Roles
export interface RolItem {
  id: number;
  nombre: string;
  descripcion: string | null;
  totalUsuarios: number;
  permisos: Permiso[];
}

// Payloads para creación y actualización
export interface CrearRolPayload {
  nombre: string;
  descripcion?: string;
  permisoIds?: number[];
}

export interface ActualizarRolPayload {
  nombre?: string;
  descripcion?: string;
  permisoIds?: number[];
}

/**
 * Custom Hook: useRoles
 * Administra el estado de la matriz de Roles y Permisos (RBAC) para SysLab 2.0.
 */
export const useRoles = () => {
  const [roles, setRoles] = useState<RolItem[]>([]);
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Cargar la lista completa de roles con sus permisos asociados
  const cargarRoles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await httpClient.get('/roles');
      setRoles(response.data.data || []);
    } catch (err: any) {
      const mensaje = err.response?.data?.message || err.message || 'Error al obtener la lista de roles.';
      setError(mensaje);
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Cargar el catálogo completo de permisos disponibles del sistema
  const cargarPermisos = useCallback(async () => {
    try {
      const response = await httpClient.get('/roles/permisos');
      setPermisos(response.data.data || []);
    } catch (err: any) {
      console.error('Error al cargar el catálogo de permisos:', err);
    }
  }, []);

  // Carga inicial de datos al montar el componente
  useEffect(() => {
    const inicializar = async () => {
      setLoading(true);
      await Promise.all([cargarRoles(), cargarPermisos()]);
      setLoading(false);
    };
    inicializar();
  }, [cargarRoles, cargarPermisos]);

  // 3. Crear un nuevo Rol con asignación de permisos
  const crearRol = async (payload: CrearRolPayload) => {
    setError(null);
    try {
      await httpClient.post('/roles', payload);
      await cargarRoles(); // Refresca el listado de roles
    } catch (err: any) {
      const mensaje = err.response?.data?.message || err.message || 'Error al registrar el rol.';
      setError(mensaje);
      throw new Error(mensaje);
    }
  };

  // 4. Actualizar un Rol existente y su matriz de permisos
  const actualizarRol = async (id: number, payload: ActualizarRolPayload) => {
    setError(null);
    try {
      await httpClient.put(`/roles/${id}`, payload);
      await cargarRoles(); // Refresca el listado
    } catch (err: any) {
      const mensaje = err.response?.data?.message || err.message || 'Error al actualizar el rol.';
      setError(mensaje);
      throw new Error(mensaje);
    }
  };

  // 5. Eliminar un Rol
  const eliminarRol = async (id: number) => {
    setError(null);
    try {
      await httpClient.delete(`/roles/${id}`);
      // Filtrado local inmediato + refresco
      setRoles((prev) => prev.filter((rol) => rol.id !== id));
    } catch (err: any) {
      const mensaje = err.response?.data?.message || err.message || 'Error al eliminar el rol.';
      setError(mensaje);
      throw new Error(mensaje);
    }
  };

  return {
    roles,
    permisos,
    loading,
    error,
    cargarRoles,
    cargarPermisos,
    crearRol,
    actualizarRol,
    eliminarRol,
  };
};